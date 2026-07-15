import type {
  AnnouncementUpdate,
  App,
  ContactSubmission,
  FAQ,
  HomepageContent,
  MediaAsset,
  Service,
  SiteSettings,
  Testimonial,
  User
} from "@prisma/client";

export type PublicSiteData = {
  settings: SiteSettings;
  homepage: HomepageContent;
  featuredApps: App[];
  services: Service[];
  faqs: FAQ[];
  testimonials: Testimonial[];
  announcements: AnnouncementUpdate[];
};

export type AdminOverviewData = {
  apps: App[];
  enquiries: ContactSubmission[];
  testimonials: number;
  announcements: AnnouncementUpdate[];
  metrics: {
    totalApps: number;
    featuredApps: number;
    publicApps: number;
    totalEnquiries: number;
    unreadEnquiries: number;
  };
};

export type MediaUploadResult = MediaAsset;
export type AdminUser = User;
