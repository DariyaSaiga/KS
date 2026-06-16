'use client';
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

import HomeIcon from "../../public/icons/home.svg"
import AddRouteIcon from "../../public/icons/add_route.svg"

export default function Menu() {
    const pathname = usePathname();

    const links = [
      {
        href: "/",
        activePaths: ["/", "/filter"],
        activePrefix: "/route",
        icon: <HomeIcon width="30" height="30" fill="white" />,
      },
      {
        href: "/add",
        activePaths: ["/add"],
        icon: <AddRouteIcon width="50" height="50" fill="white" />,
      },
    ];

    return(
        <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-[#001B3B] m-3 w-5/6 mx-auto flex justify-center rounded-xl p-2">
                {links.map((link) => {
            const isActive = link.activePaths.includes(pathname)
              || !!((link as {activePrefix?: string}).activePrefix && pathname.startsWith((link as {activePrefix?: string}).activePrefix!));
                
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative w-1/2 flex justify-center items-center"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 bg-[#003676] hover:bg-[#1C334E] rounded-lg"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="relative z-10">{link.icon}</div>
              </Link>
            );
          })}       
        </nav>
    );
};