import type { StaticImageData } from "next/image";
import scfDesktopPreview from "../../images/scfcooling-desktop.png";
import scfMobilePreview from "../../images/scfcooling-mobile.png";
import tattooDesktopPreview from "../../images/tattoostudio-desktop.png";
import tattooMobilePreview from "../../images/tattoostudio-mobile.png";
import gamingDesktopPreview from "../../images/gaming-desktop.png";
import gamingMobilePreview from "../../images/gaming-mobile.png";
import lincDesktopPreview from "../../images/linc-desktop.png";
import lincMobilePreview from "../../images/linc-mobile.png";

export type PortfolioImages = {
  desktop: StaticImageData;
  mobile: StaticImageData;
};

export const portfolioImagesBySlug: Record<string, PortfolioImages> = {
  scfcooling: { desktop: scfDesktopPreview, mobile: scfMobilePreview },
  tattoostudio: { desktop: tattooDesktopPreview, mobile: tattooMobilePreview },
  gaming: { desktop: gamingDesktopPreview, mobile: gamingMobilePreview },
  linc: { desktop: lincDesktopPreview, mobile: lincMobilePreview }
};

export const featuredSlugOrder = ["scfcooling", "tattoostudio", "gaming", "linc"];
