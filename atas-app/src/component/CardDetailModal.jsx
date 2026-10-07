import { memo, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Button from "./Button";
import TextInput from "./TextInput";
import Modal from "./Modal";
import MarkdownContent from "./MarkdownContent";

function CardDetailsModal({
  card,
  isOpen,
  onClose,
  onCardUpdated,
  onCardDeleted,
  canEdit = true,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState("edit");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (card) {
      setTitle(card.title || "");
      setDescription(card.description || "");
      setActiveTab(canEdit ? "edit" : "preview");
    }
  }, [card, canEdit]);

  if (!isOpen || !card) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Card title cannot be empty.");
      return;
    }

    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/card/update/${card._id}`,
        { title: title.trim(), description },
        { withCredentials: true }
      );

      const updatedCard = response.data.card || { ...card, title: title.trim(), description };
      toast.success("Card updated successfully!");
      onCardUpdated(updatedCard);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update card.");
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/card/delete/${card._id}`,
        { withCredentials: true }
      );
      toast.success("Card deleted successfully!");
      onCardDeleted(card._id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete card.");
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <>
      <dialog
        open={isOpen}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto bg-input border border-divider rounded-2xl p-6 shadow-2xl shadow-black/40 text-primary backdrop:bg-black/60 backdrop:backdrop-blur-[2px] flex flex-col gap-4 z-50"
      >
        <div className="flex items-center justify-between pb-3 border-b border-divider">
          <span className="text-xs font-mono text-brand uppercase tracking-wider">
            Card Details
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-accent-color hover:text-primary transition-colors text-xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-1">
            Card Title
          </label>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title..."
            disabled={!canEdit}
          />
        </div>

        <div className="flex-1 flex flex-col min-h-[220px]">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-secondary">
              Description (Markdown)
            </label>
            <div className="flex gap-1 bg-main border border-divider p-1 rounded-lg">
              {canEdit && <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  activeTab === "edit"
                    ? "bg-brand/15 text-brand"
                    : "text-secondary hover:text-primary"
                }`}
              >
                Write
              </button>}
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  activeTab === "preview"
                    ? "bg-brand/15 text-brand"
                    : "text-secondary hover:text-primary"
                }`}
              >
                Preview
              </button>
            </div>
          </div>

          {activeTab === "edit" ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add detailed notes, checklists, or links..."
              disabled={!canEdit}
              className="w-full flex-1 min-h-[160px] bg-main border border-divider rounded-lg p-3 text-sm text-primary placeholder-accent-color/70 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none font-mono"
            />
          ) : (
            <div className="w-full flex-1 min-h-[160px] bg-main border border-divider rounded-lg p-3 text-sm text-primary overflow-y-auto">
              {description ? (
                <MarkdownContent className="break-words [&_p]:mb-3 [&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[#161616] [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-brand [&_a]:underline [&_code]:rounded [&_code]:bg-[#161616] [&_code]:px-1 [&_code]:font-mono [&_table]:w-full [&_th]:border [&_th]:border-divider [&_th]:p-1 [&_td]:border [&_td]:border-divider [&_td]:p-1">
                  {description}
                </MarkdownContent>
              ) : (
                <p className="text-secondary italic text-xs">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-divider">
          {canEdit && <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            className="text-xs text-danger hover:brightness-110 font-medium cursor-pointer"
          >
            Delete Card
          </button>}

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              {canEdit ? "Cancel" : "Close"}
            </Button>
            {canEdit && <Button onClick={handleSave}>Save Changes</Button>}
          </div>
        </div>
      </dialog>

      <Modal
        title="Delete Card"
        content={`Are you sure you want to delete "${card.title}"?`}
        display={showConfirmDelete}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setShowConfirmDelete(false)}
        confirmIsLoading={isDeleting}
      />
    </>
  );
}

export default memo(CardDetailsModal);