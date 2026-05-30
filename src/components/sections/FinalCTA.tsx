import Button from "@/components/ui/Button";
import GradientText from "@/components/ui/GradientText";

export default function FinalCTA() {
  return (
    <section
      className="bg-[#0A0A0A] py-16 md:py-32"
      style={{
        background:
          "radial-gradient(circle 800px at 50% 50%, rgba(59,130,246,0.06) 0%, transparent 70%), #0A0A0A",
      }}
    >
      <div className="mx-auto w-full max-w-[680px] px-6 text-center md:px-10">
        <h2 className="font-heading text-[30px] font-extrabold leading-tight text-[#F0F0F0] md:text-[52px]">
          Stop sending resumes that were
          <br />
          <GradientText>never meant for the job.</GradientText>
        </h2>
        <p className="mx-auto mt-4 max-w-[480px] text-base leading-[1.7] text-[#555555] md:text-lg">
          Your GitHub shows what you can build. PositionPerfect shows it in the language that gets
          you hired.
        </p>
        <div className="mt-9">
          <Button variant="primary" size="lg" glow href="/auth/github">
            Build My First Tailored Resume -&gt;
          </Button>
        </div>
        <p className="mt-4 text-sm text-[#444444]">
          Free to start <span className="text-[#333333]">·</span> No credit card <span className="text-[#333333]">·</span> Takes 2 minutes
        </p>
      </div>
      <div className="mx-auto mt-16 h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-[rgba(59,130,246,0.3)] to-transparent opacity-50" />
    </section>
  );
}
