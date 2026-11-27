import { CategoryCards } from '@/components/CategoryCards';
import { CommitmentCards } from '@/components/CommitmentCards';
import { CuratedCarousel } from '@/components/CuratedCarousel';
import { EditorialBanner } from '@/components/EditorialBanner';
import { HeroCopy } from '@/components/Hero';
import { HomeStage } from '@/components/HomeStage';
import { PrototypeHighlights } from '@/components/PrototypeHighlights';
import { SectionFrame } from '@/components/SectionFrame';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { StoreCta } from '@/components/StoreCta';
import { heroSlides } from '@/lib/hero-slides';
import { loadHomeContent } from '@/lib/home-content';

// app_config changes must hide/show curated sections without a rebuild.
// Full-page CDN caching is traded for per-request server rendering (DD-HOME-19).
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const content = await loadHomeContent();

  return (
    <>
      <HomeStage
        slides={heroSlides}
        chrome={
          <SiteHeader navigation={content.navigation} whatsappUrl={content.whatsappUrl} />
        }
        heroCopy={<HeroCopy hero={content.hero} tone="on-light" />}
      >
        <CategoryCards navigation={content.navigation} />
        <EditorialBanner />
        <PrototypeHighlights />

        <SectionFrame visible={content.selections.masVendidos.length > 0}>
          <CuratedCarousel
            id="mas-vendidos"
            title="Más vendidos"
            label="Más vendidos, selección de la tienda"
            items={content.selections.masVendidos}
          />
        </SectionFrame>

        <SectionFrame visible={content.selections.masReferenciados.length > 0}>
          <CuratedCarousel
            id="mas-referenciados"
            title="Más referenciados"
            label="Más referenciados, selección de la tienda"
            items={content.selections.masReferenciados}
          />
        </SectionFrame>

        <CommitmentCards items={content.commitments} />
        <StoreCta whatsappUrl={content.whatsappUrl} />
      </HomeStage>

      <SiteFooter
        navigation={content.navigation}
        socials={content.socials}
        legalLinks={content.legalLinks}
      />
    </>
  );
}
