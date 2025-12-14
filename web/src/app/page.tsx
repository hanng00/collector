import { CollectorMechanism } from "@/app/(marketing)/_components/home/CollectorMechanism";
import { HomeCTA } from "@/app/(marketing)/_components/home/HomeCTA";
import { HomeHeader } from "@/app/(marketing)/_components/home/HomeHeader";
import { HomeHero } from "@/app/(marketing)/_components/home/HomeHero";
import { TemplatesStrip } from "@/app/(marketing)/_components/home/TemplatesStrip";
import { Testimonials } from "@/app/(marketing)/_components/home/Testimonials";
import { ValuePillars } from "@/app/(marketing)/_components/home/ValuePillars";

export default function Home() {
  return (
    <main>
      <HomeHeader />
      <HomeHero />
      <TemplatesStrip />
      <CollectorMechanism />
      <ValuePillars />
      <Testimonials />
      <HomeCTA />
    </main>
  );
}
