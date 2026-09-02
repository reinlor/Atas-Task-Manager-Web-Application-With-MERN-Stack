const Team = require('../models/teamModel');
const redisClient = require('../config/redis');
const { createAndEmitNotification } = require('../services/notificationService');

const truncate = (str, maxLength = 20) => {
    if (!str) return '';
    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
};

// Controller function to create a team
exports.createTeam = async (req, res) => {
    try {
        const { id } = req.user;
        const { name, members } = req.body;

        const newTeam = new Team({
            name,
            owner: id,
            members: members || []
        });

        const savedTeam = await newTeam.save();

        const populatedTeam = await Team.findById(savedTeam._id)
            .populate('owner', 'username email')
            .populate('members.user', 'username email'); 
        
        const teamName = truncate(name, 20);
        if (members && Array.isArray(members)) {
            for (const member of members) {
                const memberId = member.user.toString();
                if (memberId !== id.toString()) {
                    await createAndEmitNotification({
                        userId: memberId,
                        type: 'invite',
                        text: `You were added to "${teamName}"`
                    });
                }
            }
        }

        return res.status(201).json({ 
            message: 'Team created successfully', 
            team: populatedTeam 
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Controller function to retrieve team info
exports.findTeam = async (req, res) => {
    try {
        const { teamId } = req.params;

        // Fixed: changed lowercase team to Team to prevent variable shadowing over the imported model
        const team = await Team.findById(teamId)
            .populate('owner', 'username email')
            .populate('members.user', 'username email'); // Fixed: changed collaborators to members

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        return res.status(200).json(team);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller to update a team (e.g., name or adding/updating members)
exports.updateTeam = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { teamId } = req.params;
        const { name, members } = req.body;

        const team = await Team.findById(teamId);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        if (team.owner.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized: Only the team owner can update this team' });
        }

        const existingMemberMap = new Map(
            team.members.map((m) => [m.user.toString(), m.role])
        );

        if (name) team.name = name;
        if (members) team.members = members;

        const updatedTeam = await team.save();

        const populatedTeam = await Team.findById(updatedTeam._id)
            .populate('owner', 'username email')
            .populate('members.user', 'username email');

        const teamName = truncate(team.name, 20);
            
        // Notify members additions and role changes
        if (members && Array.isArray(members)) {
            for (const m of members) {
                const memberId = m.user.toString();
                if (memberId === userId.toString()) continue; // Skip owner

                const previousRole = existingMemberMap.get(memberId);

                if (!previousRole) {
                    // newlu added member
                    await createAndEmitNotification({
                        userId: memberId,
                        type: 'invite',
                        text: `You were added to "${teamName}"`
                    });
                } else if (previousRole !== m.role) {
                    // member role changed by owner
                    await createAndEmitNotification({
                        userId: memberId,
                        type: 'role',
                        text: `Your role on "${teamName}" was changed to ${m.role}`
                    });
                }
            }
        }

        return res.status(200).json({
            message: 'Team updated successfully',
            team: populatedTeam
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller to retrieve all teams where the user is either the owner or a member
exports.getUserTeams = async (req, res) => {
    try {
        const { id: userId } = req.user;

        const teams = await Team.find({
            $or: [
                { owner: userId },
                { 'members.user': userId }
            ]
        })
        .populate('owner', 'username email')
        .populate('members.user', 'username email')
        .sort({ createdAt: -1 });

        return res.status(200).json({
            count: teams.length,
            teams
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller function to delete a team
exports.deleteTeam = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { teamId } = req.params;

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: 'Team not found' });

        if (team.owner.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized: Only the team owner can delete this team' });
        }

        await Team.findByIdAndDelete(teamId);
        return res.status(200).json({ message: 'Team deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};