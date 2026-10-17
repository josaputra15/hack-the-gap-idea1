/* Real Myanmar snapshot for the hackathon demo.
   Every headline, number and URL below is taken from the listed article.
   Do not add facts that are not in this file. */
import type { SourceRef } from "./data";

export type MyanmarStory = {
  id: string;
  category: string;
  scope: "local" | "international";
  headline: string;
  original: string;
  points: string[];
  why: string;
  sources: SourceRef[];
};

const local = (outlet: string, publishedAt: string, url: string, via?: string, kind: SourceRef["kind"] = "independent"): SourceRef =>
  ({ outlet, via, url, scope: "local", kind, publishedAt });
const intl = (outlet: string, publishedAt: string, url: string, kind: SourceRef["kind"] = "independent"): SourceRef =>
  ({ outlet, url, scope: "international", kind, publishedAt });

export const MYANMAR = {
  code: "mm",
  name: "Myanmar",
  center: [96.0, 21.0] as [number, number],
  national: [
    {
      id: "mm-us-talks",
      category: "Politics",
      scope: "international" as const,
      headline: "US and Myanmar's military government hold a second round of talks",
      original: "US Holds Second Round of Talks With Myanmar Regime as Concerns Grow Over Policy Shift",
      points: [
        "US officials met regime officials in Tokyo last week, Reuters reported.",
        "The first round of talks was in mid-September in Naypyitaw.",
      ],
      why: "Talks could change how the US treats Myanmar's military government, which seized power in a 2021 coup.",
      sources: [local("The Irrawaddy", "2026-10-16", "https://www.irrawaddy.com/news/myanmars-crisis-the-world/us-holds-second-round-of-talks-with-myanmar-regime-as-concerns-grow-over-policy-shift.html")],
    },
    {
      id: "mm-asean-welcome",
      category: "Politics",
      scope: "international" as const,
      headline: "Neighbours welcome Myanmar's leader again while the war goes on",
      original: "Myanmar's coup leader-turned-president wins back neighbours despite war",
      points: [
        "Min Aung Hlaing was welcomed in Kuala Lumpur. Malaysia is the fifth ASEAN country to host him since April.",
        "Monitoring groups say the war has killed up to 100,000 people and displaced at least 3.5 million.",
      ],
      why: "Friendly visits can bring Myanmar back into regional politics, even as fighting continues.",
      sources: [
        intl("Al Jazeera", "2026-10-16", "https://www.aljazeera.com/news/2026/10/16/as-war-rages-myanmars-coup-leader-turned-president-wins-back-neighbours"),
        intl("Al Jazeera", "2026-10-08", "https://www.aljazeera.com/news/2026/10/8/malaysia-to-help-myanmar-reintegrate-into-asean-despite-rights-concerns"),
        intl("Al Jazeera (Opinion)", "2026-10-16", "https://www.aljazeera.com/opinions/2026/10/16/malaysias-welcome-for-min-aung-hlaing-undermines-its-stand-on-justice"),
      ],
    },
    {
      id: "mm-scam-sentences",
      category: "Justice",
      scope: "international" as const,
      headline: "China sentences three scam-centre bosses to death",
      original: "China sentences three people to death for running Myanmar scam centres",
      points: [
        "A court in Quanzhou, China, sentenced three members of the 'Wei family' gang to death.",
        "The gang allegedly ran 14 large scam compounds in Myanmar and made more than $1.8 billion.",
      ],
      why: "Scam centres in Myanmar have trapped thousands of people and cheated victims around the world.",
      sources: [
        intl("Al Jazeera", "2026-10-13", "https://www.aljazeera.com/news/2026/10/13/china-sentences-three-people-to-death-for-running-myanmar-scam-centres"),
        local("Myanmar Now (AFP)", "2026-10-13", "https://myanmar-now.org/en/news/china-sentences-to-death-myanmar-scam-clan-members/", undefined, "wire"),
      ],
    },
    {
      id: "mm-belarus-loans",
      category: "Economy",
      scope: "local" as const,
      headline: "Myanmar's government borrows from Belarus as money runs short",
      original: "Myanmar Regime Turns to Belarus for High Interest Loans as Fiscal Crisis Deepens",
      points: [
        "Interest rates on the loans are 2.25% to 9.33%, for 1 to 5 years.",
        "Parliament also approved borrowing up to 2.1 trillion kyats from the central bank.",
      ],
      why: "More debt can mean higher prices and less money for public services.",
      sources: [local("The Irrawaddy", "2026-10-16", "https://www.irrawaddy.com/news/burma/myanmar-regime-turns-to-belarus-for-high-interest-loans-as-fiscal-crisis-deepens.html")],
    },
    {
      id: "mm-airstrikes-report",
      category: "Conflict",
      scope: "local" as const,
      headline: "Report: most military airstrikes hit civilians",
      original: "Nearly 70 Percent of Myanmar Junta Airstrikes Targeted Civilians, Report Finds",
      points: [
        "A report looked at more than 2,400 airstrikes.",
        "It found nearly 70% targeted civilians, not armed groups.",
      ],
      why: "Airstrikes on homes, schools and markets are a major cause of deaths and displacement.",
      sources: [local("Karen Information Center", "2026-10-15", "https://www.bnionline.net/en/news/nearly-70-percent-myanmar-junta-airstrikes-targeted-civilians-report-finds", "BNI")],
    },
  ],
  places: [
    {
      name: "Yangon",
      at: [96.1951, 16.8661] as [number, number],
      stories: [
        {
          id: "mm-yangon-returnees",
          category: "Migration",
          scope: "international" as const,
          headline: "Almost 1,500 people sent back from Malaysia arrive in Yangon",
          original: "Nearly 1,500 migrants arrive in Myanmar from Malaysia despite UN warnings",
          points: [
            "1,479 people came on Malaysian navy ships and landed in southern Yangon.",
            "The UN refugee agency says its staff could not check that people chose freely to return.",
          ],
          why: "Rights groups warn it is not safe to send people back to a country at war.",
          sources: [
            intl("Al Jazeera", "2026-10-05", "https://www.aljazeera.com/news/2026/10/5/nearly-1500-migrants-arrive-in-myanmar-from-malaysia-despite-un-warnings"),
            intl("Al Jazeera", "2026-10-06", "https://www.aljazeera.com/news/2026/10/6/malaysias-anwar-to-host-myanmar-leader-as-repatriations-surpass-10000"),
          ],
        },
        {
          id: "mm-yangon-arakanese-held",
          category: "Migration",
          scope: "local" as const,
          headline: "Over 400 people from Rakhine are held in Yangon after being sent home",
          original: "Over 400 Arakanese Deportees Remain Detained in Yangon Under Tight Security",
          points: [
            "About 200 are held in Thanlyin and about 200 in Hlaingtharyar, sources say.",
            "Families fear young detainees could be forced into the army.",
          ],
          why: "Returnees are not free to go home, which raises safety and rights concerns.",
          sources: [local("Development Media Group", "2026-10-16", "https://www.bnionline.net/en/news/over-400-arakanese-deportees-remain-detained-yangon-under-tight-security", "BNI")],
        },
      ],
    },
    {
      name: "Mandalay",
      at: [96.0891, 21.9588] as [number, number],
      stories: [
        {
          id: "mm-mandalay-fear",
          category: "Crime",
          scope: "local" as const,
          headline: "People in Mandalay are afraid of kidnappings and armed groups",
          original: "Fear grips Mandalay as junta-backed militias and kidnappers prey on residents",
          points: [
            "Crime and forced army recruitment are making people feel unsafe.",
            "Zegyo Market, usually busy, has become quiet.",
          ],
          why: "Mandalay is Myanmar's second-largest city. Fear there affects jobs and daily life.",
          sources: [local("Myanmar Now", "2026-10-16", "https://myanmar-now.org/en/news/fear-grips-mandalay-as-junta-backed-militias-and-kidnappers-prey-on-residents/")],
        },
      ],
    },
    {
      name: "Sittwe",
      at: [92.9, 20.1462] as [number, number],
      stories: [
        {
          id: "mm-sittwe-fighting",
          category: "Conflict",
          scope: "local" as const,
          headline: "Fighting grows near Sittwe as the Arakan Army takes military posts",
          original: "Arakan Army Captures Myanmar Junta Outposts as Fighting Intensifies Near Sittwe",
          points: [
            "The Arakan Army reportedly took nine military posts near roads into Sittwe.",
            "Fighting is happening on at least six fronts, with drones, artillery and airstrikes.",
          ],
          why: "Sittwe is the capital of Rakhine State. A battle there would put many civilians at risk.",
          sources: [local("Development Media Group", "2026-10-15", "https://www.bnionline.net/en/news/arakan-army-captures-myanmar-junta-outposts-fighting-intensifies-near-sittwe", "BNI")],
        },
      ],
    },
    {
      name: "Myitkyina",
      at: [97.3964, 25.3831] as [number, number],
      stories: [
        {
          id: "mm-kachin-talks",
          category: "Politics",
          scope: "local" as const,
          headline: "Kachin armed group says no to the military's offer of peace talks",
          original: "KIO/KIA rejects Myanmar junta's offer of peace talks",
          points: [
            "The KIO/KIA says the army is sending more troops into Kachin State.",
            "It says talks would not change the situation on the ground.",
          ],
          why: "Peace talks are only possible if both sides agree to them.",
          sources: [
            local("Myanmar Now", "2026-10-15", "https://myanmar-now.org/en/news/kio-kia-rejects-myanmar-juntas-offer-of-peace-talks/"),
            local("Khonumthung News", "2026-10-16", "https://www.bnionline.net/en/news/myanmar-junta-renews-peace-talks-invitation-cnf-knu-and-absdf", "BNI"),
          ],
        },
        {
          id: "mm-myitkyina-convoy",
          category: "Conflict",
          scope: "local" as const,
          headline: "Large army convoy brings supplies to bases on the road to Myitkyina",
          original: "Myanmar Junta Convoy Resupplies Military Bases Along Route to Myitkyina",
          points: [
            "A convoy of more than 100 vehicles reached a regional army headquarters.",
            "It resupplied bases along the way.",
          ],
          why: "Supply convoys often come before new fighting.",
          sources: [local("Kachin News Group", "2026-10-15", "https://www.bnionline.net/en/news/myanmar-junta-convoy-resupplies-military-bases-along-route-myitkyina", "BNI")],
        },
      ],
    },
    {
      name: "Bilin",
      at: [97.2306, 17.2264] as [number, number],
      stories: [
        {
          id: "mm-mon-airstrikes",
          category: "Conflict",
          scope: "local" as const,
          headline: "Airstrikes near the Mon–Karen border kill at least 8 civilians",
          original: "At least 8 civilians killed by Myanmar junta airstrikes near Mon-Karen border",
          points: [
            "Two airstrikes hit villages late on Tuesday night, residents said.",
            "Victims included people in Ahlugyi village, Bilin Township.",
          ],
          why: "Villages near front lines face sudden attacks with little warning.",
          sources: [local("Myanmar Now", "2026-10-15", "https://myanmar-now.org/en/news/at-least-8-civilians-killed-by-myanmar-junta-airstrikes-near-mon-karen-border/")],
        },
        {
          id: "mm-mon-heat",
          category: "Weather",
          scope: "local" as const,
          headline: "Extreme heat kills five people in Mon State",
          original: "Heat-Related Deaths in Myanmar's Mon State Rise to Five",
          points: [
            "Four people died in Bilin Township and one in Thaton between October 1 and 14.",
            "Temperatures reached 37°C, and officials expect more heat.",
          ],
          why: "Power cuts make it hard for people to stay cool at home.",
          sources: [local("Than Lwin Times", "2026-10-16", "https://www.bnionline.net/en/news/heat-related-deaths-myanmars-mon-state-rise-five", "BNI")],
        },
      ],
    },
    {
      name: "Hsenwi",
      at: [97.9667, 23.3] as [number, number],
      stories: [
        {
          id: "mm-shan-mining",
          category: "Environment",
          scope: "local" as const,
          headline: "Farmers fear mining could ruin 7,000 acres of farmland",
          original: "Locals Fear Mining Could Damage 7,000 Acres of Farmland Along Shan-Kachin Border",
          points: [
            "The farmland is in the Loihohsay area of Hsenwi Township.",
            "About 95% of the 30,000 people there live from farming.",
          ],
          why: "Losing farmland means losing food and income for thousands of families.",
          sources: [local("Shan Herald Agency for News", "2026-10-16", "https://www.bnionline.net/en/news/locals-fear-mining-could-damage-7000-acres-farmland-along-shan-kachin-border", "BNI")],
        },
        {
          id: "mm-shan-border-gates",
          category: "Economy",
          scope: "local" as const,
          headline: "Armed groups upgrade trade gates on the China border",
          original: "TNLA and MNDAA rapidly upgrading Chinese border gates",
          points: [
            "The TNLA and MNDAA signed ceasefires with the military last year.",
            "Locals say both groups are now quickly upgrading border trade gates.",
          ],
          why: "Border trade affects prices and jobs across northern Myanmar.",
          sources: [local("Myanmar Now", "2026-10-16", "https://myanmar-now.org/en/news/tnla-and-mndaa-rapidly-upgrading-chinese-border-gates/")],
        },
      ],
    },
    {
      name: "Mindon",
      at: [94.738, 19.349] as [number, number],
      stories: [
        {
          id: "mm-magway-push",
          category: "Conflict",
          scope: "local" as const,
          headline: "Three killed in Magway as the army pushes toward Rakhine",
          original: "Three killed in Magway Region as Myanmar junta forces continue push into Rakhine",
          points: [
            "Army forces are trying to enter Rakhine State from three places in Magway Region.",
            "An airstrike hit Chinhnit village in Mindon Township on October 8.",
          ],
          why: "Civilians along the route are caught in the fighting.",
          sources: [local("Myanmar Now", "2026-10-14", "https://myanmar-now.org/en/news/three-killed-in-magway-region-as-myanmar-junta-forces-continue-push-into-rakhine/")],
        },
      ],
    },
  ],
};
