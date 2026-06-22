// Central GSAP setup. Import this anywhere you need gsap/plugins so that
// plugins are registered exactly once on the client.
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// SplitText is free & bundled since GSAP 3.13 — no Club plugin needed.
gsap.registerPlugin(useGSAP, SplitText, ScrollTrigger);

export { gsap, useGSAP, SplitText, ScrollTrigger };
