'use client';

import { cn } from "@/lib/utils";
import * as React from "react";

const DrivergyLogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    {...props}
  >
    <path
      fill="currentColor"
      d="M50 10c22.1 0 40 17.9 40 40S72.1 90 50 90 10 72.1 10 50 27.9 10 50 10zm0 8c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32z"
    />
    <path
      fill="currentColor"
      d="M50 34c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16-7.2-16-16-16zm0 8.8c-2.4-3.9 1.3-8.8 6.1-8.1 3.4.5 6.1 3.2 6.7 6.6.8 4.8-3.9 8.7-8.1 6.7L50 42.8z"
    />
  </svg>
);


const DrivergyLogo = (props: React.SVGProps<SVGSVGElement> & {className?: string}) => (
    // This component now only returns the text part of the logo.
    // The icon is handled separately in the sidebar to allow for independent show/hide logic.
    <span className={cn("font-headline text-2xl font-extrabold text-primary tracking-tighter", props.className)}>
        DRIVERGY
    </span>
);

export { DrivergyLogo, DrivergyLogoIcon };
