export default function AuthLayout({ eyebrow, title, subtitle, children }) {
    return (
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border border-divider/60 shadow-2xl shadow-black/40 bg-main">

            {/* BRAND PANEL — product identity, hidden on small screens */}
            <div className="hidden lg:flex lg:col-span-6 flex-col justify-between bg-[#161616] p-10">
                <div>
                    <div className="flex items-center gap-2 font-mono text-sm text-brand">
                        <span>&gt;_</span>
                        <span className="text-primary font-medium tracking-tight">atas</span>
                    </div>

                    <h1 className="mt-10 text-3xl font-semibold text-primary leading-snug max-w-sm">
                        Plan in markdown.<br />Ship together.
                    </h1>
                    <p className="mt-3 text-secondary text-sm max-w-xs">
                        Every task is a document your team edits in real time — no separate notes app, no status meeting.
                    </p>
                </div>

                {/* Div markdown like Decoration */}
                <div className="mt-10 rounded-xl border border-divider bg-main/60 p-5 font-mono text-[13px] leading-7">
                    <p className="text-secondary"># Sprint 12</p>
                    <p><span className="text-brand">[x]</span> <span className="text-secondary line-through decoration-accent-color/60">Wireframe auth flow</span></p>
                    <p><span className="text-brand">[x]</span> <span className="text-secondary line-through decoration-accent-color/60">Connect socket rooms</span></p>
                    <p><span className="text-accent-color">[ ]</span> <span className="text-primary">Real-time cursor sync</span></p>
                    <p><span className="text-accent-color">[ ]</span> <span className="text-primary">Ship dark mode<span className="animate-pulse text-brand">▍</span></span></p>
                </div>

                <div className="mt-6 flex items-center gap-2 text-xs text-secondary">
                    <span className="flex -space-x-2">
                        <span className="w-5 h-5 rounded-full bg-brand/80 border-2 border-[#161616]" />
                        <span className="w-5 h-5 rounded-full bg-accent-color/80 border-2 border-[#161616]" />
                        <span className="w-5 h-5 rounded-full bg-secondary/80 border-2 border-[#161616]" />
                    </span>
                    3 collaborators editing this board
                </div>
            </div>

            {/* FORM panel use to display: Login, Register, Forgot forms */}
            <div className="col-span-1 lg:col-span-6 bg-main p-8 sm:p-12 flex flex-col justify-center">
                <div className="w-full max-w-sm mx-auto">
                    {eyebrow && (
                        <p className="font-mono text-xs tracking-widest text-accent-color uppercase mb-2">
                            {eyebrow}
                        </p>
                    )}
                    {title && <h2 className="text-2xl font-semibold text-primary">{title}</h2>}
                    {subtitle && <p className="text-secondary text-sm mt-1 mb-7">{subtitle}</p>}
                    {children}
                </div>
            </div>
        </div>
    );
}