import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react"

export const SITE_NAME = "Poultry Sathi"
export const SITE_TAGLINE =
  "The modern poultry trading business management platform for purchases, sales, inventory, billing, payments and analytics."

export interface NavLink {
  href: string
  label: string
}

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export interface FooterColumn {
  title: string
  links: NavLink[]
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
  {
    title: "Product",
    links: [
      { href: "/#modules", label: "Modules" },
      /*{ href: "/pricing", label: "Pricing" },*/
      { href: "/contact", label: "Book a Demo" },
      { href: "/login", label: "Sign In" },
      { href: "/signup", label: "Create Account" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/#faq", label: "FAQ" },
      { href: "/contact", label: "Help & Support" },
      { href: "/features", label: "Feature Guide" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms & Conditions" },
    ],
  },
]

export interface SocialLink {
  href: string
  label: string
  icon: LucideIcon
}

export const SOCIAL_LINKS: SocialLink[] = [
  { href: "https://www.facebook.com/zarsolutions.co.in?rdid=SLNQdWL3GM0uLNTt&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1XZ5tzboxR#", label: "Facebook", icon: Facebook },
  { href: "https://x.com/zarsolutionsco", label: "Twitter", icon: Twitter },
  { href: "https://www.instagram.com/zarsolutions", label: "Instagram", icon: Instagram },
  { href: "https://www.linkedin.com/in/zar-solutions-a63bb6411", label: "LinkedIn", icon: Linkedin },
  { href: "https://www.youtube.com/@zarsolutions", label: "YouTube", icon: Youtube },
]

export const CONTACT_INFO = {
  email: "contact@zarsolutions.co.in",
  phone: "+91 72472 48886",
  address: "Zar Solutions, 241-242, First Floor, Chouhan Estate, Supela, Bhilai Nagar, Durg, Chhattisgarh – 490023, India",
}
