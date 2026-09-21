// Navigation configuration for sidebar and mobile nav
import {
  LayoutDashboard,
  Monitor,
  Printer,
  Wifi,
  Landmark,
  CreditCard,
  Users,
  UserCircle,
  KeyRound,
  Mail,
  Shield,
  CheckSquare,
  ClipboardList,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  mobileVisible?: boolean; // show in bottom nav
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    mobileVisible: true,
  },
  {
    title: "Pegawai",
    href: "/pegawai",
    icon: Users,
  },
  {
    title: "PC",
    href: "/pc",
    icon: Monitor,
    mobileVisible: true,
  },
  {
    title: "Printer",
    href: "/printer",
    icon: Printer,
  },
  {
    title: "Wifi",
    href: "/wifi",
    icon: Wifi,
  },
  {
    title: "ATM",
    href: "/atm",
    icon: Landmark,
  },
  {
    title: "EDC",
    href: "/edc",
    icon: CreditCard,
  },
  {
    title: "User Estim",
    href: "/user-estim",
    icon: UserCircle,
  },
  {
    title: "Credentials",
    href: "/credentials",
    icon: KeyRound,
  },
  {
    title: "Office",
    href: "/office",
    icon: Mail,
  },
  {
    title: "FortiClient",
    href: "/forticlient",
    icon: Shield,
  },
  {
    title: "To-Do",
    href: "/todo",
    icon: CheckSquare,
    mobileVisible: true,
  },
  {
    title: "Audit",
    href: "/audit",
    icon: ClipboardList,
    mobileVisible: true,
  },
];
