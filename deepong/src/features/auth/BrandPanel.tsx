export function BrandPanel() {
    return (
        <section
            className="relative hidden flex-1 flex-col justify-between overflow-hidden p-14 text-white md:flex"
            style={{
                background: "linear-gradient(155deg, #2F6BFF 0%, #1F4FD9 100%)",
            }}
        >
            <div
                className="pointer-events-none absolute -right-24 -top-24 h-[400px] w-[400px] rounded-full bg-white/5"/>
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-white/5"/>

            <div className="relative flex items-center gap-2 text-sm font-bold opacity-90">
                <span className="inline-block h-2 w-2 rounded-full bg-white"/>
                디퐁
            </div>

            <div className="relative">
                <h2 className="mb-4 text-[36px] font-bold leading-[1.25] tracking-[-0.03em]">
                    알림이 나를
                    <br/>
                    방해하지 않는
                    <br/>
                    메신저
                </h2>
                <p className="text-base leading-relaxed opacity-85">
                    메시지는 언제든, 알림은 적절할 때.
                    <br/>
                    집중과 연결이 공존하는 공간.
                </p>
            </div>

            <div className="relative rounded-md border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] opacity-70">
                    DEEPONG 원칙
                </div>
                <div className="text-sm leading-relaxed">
                    친구가 집중 중일 때, 수다는 조용히 기다립니다. 급할 때만 알림이
                    갑니다.
                </div>
            </div>
        </section>
    );
}
