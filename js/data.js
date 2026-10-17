/* ------------------------------------------------------------------
   PLACEHOLDER NEWS DATA
   Every story below is made up for the prototype. Swap this file for a
   real API later — the app only needs the shape shown in `story()`.
   Story tuple: [category, plainHeadline, originalHeadline, point1, point2, whyItMatters]
------------------------------------------------------------------- */

const RAW = [
  {
    code: "us", name: "United States", center: [-98.5, 39.5],
    national: [
      ["Economy", "Prices are rising more slowly this month", "Consumer price growth moderates for third consecutive month", "Everyday prices went up less than last month.", "Food and gas costs stayed about the same.", "Slower price rises can make it easier for families to plan budgets."],
      ["Science", "NASA tests a new rocket engine", "NASA completes hot-fire test of next-generation engine", "Engineers fired the engine for eight minutes.", "The test went as planned.", "This engine may carry people to the Moon in a few years."],
    ],
    places: [
      { name: "New York City", at: [-74.006, 40.7128], stories: [
        ["Transport", "Subway adds late-night trains on two lines", "MTA expands overnight service on select lines", "Trains will come every 10 minutes after midnight.", "The change starts next Monday.", "Night-shift workers will wait less to get home."],
        ["Culture", "Free outdoor concerts return to Central Park", "Summer concert series announces fall extension", "Six free shows are planned this month.", "No tickets are needed.", "Free events help more people enjoy the city."],
      ]},
      { name: "Los Angeles", at: [-118.2437, 34.0522], stories: [
        ["Weather", "Hot, dry winds expected this weekend", "Red flag warning issued for LA County", "Wind may reach 50 km/h in the hills.", "Officials ask people to be careful with fire.", "Dry wind can make wildfires spread fast."],
        ["Tech", "City tests self-driving buses downtown", "LA Metro launches autonomous shuttle pilot", "Three small buses will run on one route.", "A safety driver stays on board.", "This could change how cities run public transport."],
      ]},
    ],
  },
  {
    code: "br", name: "Brazil", center: [-51.9, -10.5],
    national: [
      ["Environment", "Less forest was cut in the Amazon this year", "Deforestation in the Amazon falls to multi-year low", "Satellite images show fewer trees cut down.", "The drop is about 20% from last year.", "The Amazon helps control the world's climate."],
      ["Sport", "Brazil names new national football coach", "CBF confirms appointment of new Seleção manager", "The coach signed a four-year deal.", "His first match is next month.", "Football is a big part of life in Brazil."],
    ],
    places: [
      { name: "São Paulo", at: [-46.6333, -23.5505], stories: [
        ["Transport", "New metro line opens to the airport", "Line 15 extension connects to Guarulhos", "The ride now takes about 35 minutes.", "Tickets cost the same as other lines.", "Travelers can skip heavy traffic."],
        ["Food", "Street food festival fills city center", "Virada Gastronômica draws record crowds", "Over 200 food stalls joined.", "The festival runs for three days.", "Local cooks get a chance to grow their business."],
      ]},
      { name: "Rio de Janeiro", at: [-43.1729, -22.9068], stories: [
        ["Environment", "Volunteers clean 5 km of beach", "Copacabana clean-up removes two tonnes of waste", "About 1,000 people helped.", "Most trash was plastic.", "Clean beaches protect sea life and tourism."],
      ]},
    ],
  },
  {
    code: "gb", name: "United Kingdom", center: [-2.5, 54.0],
    national: [
      ["Politics", "Government plans to build more homes", "Ministers unveil housing target in new planning bill", "The plan aims for 300,000 new homes a year.", "Some local groups worry about green space.", "Many young people struggle to afford a home."],
      ["Health", "Hospitals cut waiting times for scans", "NHS diagnostic backlog falls for fourth month", "Average wait dropped by two weeks.", "New scan centers opened in 12 towns.", "Faster scans help doctors find illness early."],
    ],
    places: [
      { name: "London", at: [-0.1276, 51.5072], stories: [
        ["Transport", "Tube strike called off after deal", "RMT suspends planned industrial action", "Trains will run normally this week.", "Workers and managers agreed on pay.", "Millions of people use the Tube each day."],
        ["Culture", "Museum opens free dinosaur exhibit", "Natural History Museum unveils new gallery", "The exhibit has a 20-metre skeleton.", "Entry is free for everyone.", "Free museums make learning open to all."],
      ]},
      { name: "Manchester", at: [-2.2426, 53.4808], stories: [
        ["Tech", "New tech hub to create 2,000 jobs", "Manchester innovation district secures funding", "Construction starts next spring.", "Jobs will focus on AI and software.", "More local jobs can keep young people in the city."],
      ]},
    ],
  },
  {
    code: "ng", name: "Nigeria", center: [8.0, 9.5],
    national: [
      ["Economy", "Nigeria's currency gets stronger this week", "Naira appreciates against dollar amid reforms", "The naira rose about 3% against the US dollar.", "Experts say new rules helped.", "A stronger currency can make imports cheaper."],
      ["Energy", "More homes get solar power", "Federal mini-grid programme reaches 1 million users", "Small solar networks now power many villages.", "The goal is 5 million users by 2030.", "Reliable power helps schools and small shops."],
    ],
    places: [
      { name: "Lagos", at: [3.3792, 6.5244], stories: [
        ["Transport", "Second Lagos rail line starts carrying people", "Red Line commences full passenger operations", "Trains run every 15 minutes at busy times.", "The line links the mainland to the city center.", "Traffic in Lagos is among the worst in Africa."],
        ["Culture", "Nollywood film wins top prize abroad", "Nigerian feature takes festival honours", "The film is about a family in Lagos.", "It will stream online next month.", "Nigerian films reach more people worldwide."],
      ]},
      { name: "Abuja", at: [7.4951, 9.0579], stories: [
        ["Education", "City opens 20 new public schools", "FCT commissions new primary schools", "Each school has space for 600 students.", "Classes start next term.", "More schools mean smaller, better classes."],
      ]},
    ],
  },
  {
    code: "ke", name: "Kenya", center: [37.9, 0.2],
    national: [
      ["Weather", "Heavy rain expected in many regions", "Met department issues rainfall advisory", "Rain will be strongest in the west.", "Some roads may flood.", "Farmers need the rain, but floods can be dangerous."],
      ["Tech", "Mobile money use hits a new record", "M-Pesa transactions surge in third quarter", "People sent more money by phone than ever.", "Small shops use it the most.", "Phone payments help people without bank accounts."],
    ],
    places: [
      { name: "Nairobi", at: [36.8219, -1.2921], stories: [
        ["Environment", "Nairobi plants 100,000 trees", "County launches urban greening drive", "Trees will line major roads.", "Students helped plant them.", "Trees clean the air and cool the city."],
        ["Sport", "Thousands run in city marathon", "Nairobi City Marathon sees record entries", "Over 20,000 runners took part.", "A local runner won the men's race.", "Kenya is famous for long-distance runners."],
      ]},
      { name: "Mombasa", at: [39.6682, -4.0435], stories: [
        ["Economy", "Port handles more ships than last year", "Mombasa port cargo volumes rise 8%", "More goods arrived from Asia.", "New cranes sped up work.", "The port supplies goods to many African countries."],
      ]},
    ],
  },
  {
    code: "eg", name: "Egypt", center: [30.8, 26.8],
    national: [
      ["Culture", "Grand museum welcomes one millionth visitor", "Grand Egyptian Museum marks attendance milestone", "The museum near the pyramids opened recently.", "It holds treasures of King Tutankhamun.", "Tourism brings jobs and money to Egypt."],
      ["Energy", "Big new wind farm starts working", "Gulf of Suez wind project enters service", "It can power about 1 million homes.", "It uses clean energy from strong winds.", "Clean energy reduces air pollution."],
    ],
    places: [
      { name: "Cairo", at: [31.2357, 30.0444], stories: [
        ["Transport", "New monorail line begins test runs", "Cairo monorail starts trial operations", "The train links new city areas to Cairo.", "Public rides may start next year.", "Cairo has heavy traffic every day."],
        ["Food", "Bread prices stay the same this month", "Subsidised bread price held steady", "The government kept prices fixed.", "Bread is a key food for most families.", "Stable prices help low-income families."],
      ]},
      { name: "Alexandria", at: [29.9187, 31.2001], stories: [
        ["Environment", "Sea wall project protects the coast", "Coastal defence works expand along corniche", "Workers are adding large stone blocks.", "Rising seas threaten the old city.", "Protecting the coast saves homes and history."],
      ]},
    ],
  },
  {
    code: "in", name: "India", center: [79.0, 22.5],
    national: [
      ["Science", "India's space agency launches weather satellite", "ISRO successfully places weather satellite in orbit", "The satellite will watch storms and rain.", "The launch was on time.", "Better forecasts help farmers and save lives."],
      ["Economy", "Online payments grow again", "UPI transactions cross new monthly high", "People made billions of phone payments.", "Even small street shops accept them.", "Fast payments make shopping easier."],
    ],
    places: [
      { name: "Mumbai", at: [72.8777, 19.076], stories: [
        ["Weather", "Monsoon rain ends for the season", "IMD declares monsoon withdrawal from Mumbai", "The city had more rain than usual.", "Dry weather is expected now.", "Heavy rain often floods Mumbai streets."],
        ["Culture", "Film studio opens to visitors", "Bollywood studio launches public tours", "Visitors can see real film sets.", "Tickets go on sale this week.", "Mumbai is the home of Bollywood."],
      ]},
      { name: "Bengaluru", at: [77.5946, 12.9716], stories: [
        ["Transport", "New metro line cuts commute time", "Namma Metro Yellow Line opens", "The line serves the tech district.", "Trips may be 30 minutes shorter.", "Traffic jams are a big problem in the city."],
        ["Tech", "Startups raise more money this year", "Bengaluru startup funding rebounds", "Investors put more money into new companies.", "AI startups got the most.", "New companies create jobs for young people."],
      ]},
    ],
  },
  {
    code: "jp", name: "Japan", center: [138.0, 37.0],
    national: [
      ["Tech", "Japan tests a faster bullet train", "JR Central conducts high-speed maglev trial", "The train reached 500 km/h in tests.", "It floats above the track using magnets.", "It could link Tokyo and Osaka in about an hour."],
      ["Society", "More visitors come to Japan than ever", "Inbound tourism hits record monthly high", "Over 3 million people visited last month.", "Many came from South Korea and the US.", "Tourism helps small towns earn money."],
    ],
    places: [
      { name: "Tokyo", at: [139.6917, 35.6895], stories: [
        ["Culture", "Autumn leaf festival starts in city parks", "Momiji season events open across Tokyo", "Trees are turning red and yellow.", "Parks stay open later at night.", "Seasons are an important part of Japanese culture."],
        ["Tech", "Robots help staff at a train station", "Guide robots deployed at Shinjuku Station", "Robots give directions in many languages.", "Shinjuku is the busiest station in the world.", "Robots may help with worker shortages."],
      ]},
      { name: "Osaka", at: [135.5023, 34.6937], stories: [
        ["Food", "Street food market adds night hours", "Kuromon Market extends evening trading", "Stalls now stay open until 10 pm.", "Visitors asked for later hours.", "Osaka is known as Japan's kitchen."],
      ]},
    ],
  },
  {
    code: "id", name: "Indonesia", center: [117.0, -2.5],
    national: [
      ["Politics", "Work continues on the new capital city", "Nusantara construction enters next phase", "New government buildings are almost done.", "Some offices will move next year.", "Jakarta is sinking and very crowded."],
      ["Environment", "Coral reefs show signs of recovery", "Survey finds coral regrowth in protected areas", "Fish numbers went up in safe zones.", "Fishing limits helped.", "Healthy reefs feed millions of people."],
    ],
    places: [
      { name: "Jakarta", at: [106.8456, -6.2088], stories: [
        ["Transport", "Electric buses replace old diesel buses", "TransJakarta expands electric fleet", "100 new e-buses joined this month.", "They are quieter and cleaner.", "Jakarta has serious air pollution."],
        ["Weather", "Rainy season may start early", "BMKG forecasts early wet season onset", "Rain may start in two weeks.", "People should clean drains now.", "Floods are common in Jakarta."],
      ]},
      { name: "Bali", at: [115.1889, -8.4095], stories: [
        ["Society", "Bali adds small tourist fee", "Provincial tourism levy takes effect", "Visitors pay a small fee on arrival.", "Money goes to culture and nature.", "Tourism is Bali's biggest business."],
      ]},
    ],
  },
  {
    code: "au", name: "Australia", center: [134.5, -25.5],
    national: [
      ["Environment", "Great Barrier Reef report shows mixed news", "AIMS annual survey released", "Some areas grew more coral.", "Warm water still damaged other areas.", "The reef is the world's largest living structure."],
      ["Economy", "Interest rates stay the same", "RBA holds cash rate steady", "The central bank made no change.", "Home loan costs stay level.", "Interest rates affect what people pay for homes."],
    ],
    places: [
      { name: "Sydney", at: [151.2093, -33.8688], stories: [
        ["Transport", "New metro line opens under the harbour", "Sydney Metro City section opens", "Trains run every four minutes.", "No driver is needed.", "Faster trains reduce car traffic."],
        ["Culture", "Light festival plans bigger show", "Vivid Sydney announces expanded program", "More buildings will be lit up.", "The festival is free to watch.", "It brings millions of visitors."],
      ]},
      { name: "Melbourne", at: [144.9631, -37.8136], stories: [
        ["Sport", "Tennis center gets a new roof", "Melbourne Park upgrade completed", "Matches can continue in rain or heat.", "Work took two years.", "The city hosts a world-famous tournament."],
      ]},
    ],
  },
  {
    code: "mx", name: "Mexico", center: [-102.5, 23.6],
    national: [
      ["Culture", "Day of the Dead events planned nationwide", "Día de Muertos celebrations announced", "Parades and altars will fill many cities.", "Events run from October 31 to November 2.", "The holiday honors family members who died."],
      ["Economy", "More factories open near the US border", "Nearshoring drives manufacturing growth", "Companies are moving work from Asia.", "Thousands of new jobs were created.", "Jobs near the border boost local towns."],
    ],
    places: [
      { name: "Mexico City", at: [-99.1332, 19.4326], stories: [
        ["Environment", "City adds 50 km of bike lanes", "CDMX expands cycling network", "New lanes are protected from cars.", "Bike share stations were added too.", "Biking reduces traffic and pollution."],
        ["Food", "Taco stand earns top food award", "Street vendor receives culinary recognition", "The family stand is 40 years old.", "Lines are now very long.", "Street food is central to Mexican life."],
      ]},
      { name: "Monterrey", at: [-100.3161, 25.6866], stories: [
        ["Tech", "Car maker opens electric vehicle plant", "EV assembly plant begins operations", "The factory will make 200,000 cars a year.", "About 5,000 people will work there.", "Electric cars are a fast-growing industry."],
      ]},
    ],
  },
  {
    code: "de", name: "Germany", center: [10.4, 51.1],
    national: [
      ["Transport", "Cheap monthly train ticket continues", "Deutschlandticket extended through next year", "One ticket covers local trains and buses.", "The price rises slightly.", "Cheap tickets help people leave the car at home."],
      ["Energy", "Most power now comes from clean sources", "Renewables exceed 60% of electricity supply", "Wind and solar did the most work.", "Coal use dropped again.", "Clean power helps fight climate change."],
    ],
    places: [
      { name: "Berlin", at: [13.405, 52.52], stories: [
        ["Culture", "Festival of Lights brightens the city", "Berlin Festival of Lights opens", "Famous buildings show art made of light.", "It is free and runs for ten days.", "Events bring visitors in the quiet season."],
        ["Society", "City builds more affordable flats", "Berlin approves new social housing", "About 5,000 flats are planned.", "Rents will stay low by law.", "Rent in Berlin has risen fast."],
      ]},
      { name: "Munich", at: [11.582, 48.1351], stories: [
        ["Tech", "Chip research center opens", "Semiconductor R&D hub inaugurated", "Scientists will design new computer chips.", "Many companies joined the project.", "Chips are in phones, cars and computers."],
      ]},
    ],
  },
];

const SOURCES = ["Sample Wire", "Placeholder Times", "Example Daily", "Demo Gazette", "Mock Herald"];
const COMMENT_POOL = [
  ["Ana", "Thanks for explaining this so simply."],
  ["Kofi", "Good news for my neighborhood!"],
  ["Mei", "Does anyone know when this starts?"],
  ["Lucas", "I'd like to see the full report."],
  ["Priya", "Finally. This was needed for years."],
  ["Omar", "Interesting — I didn't know this."],
  ["Sofia", "Hope they keep us updated."],
  ["Jonas", "Shared this with my family."],
];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

function story(t, ctx) {
  const [category, headline, original, p1, p2, why] = t;
  const id = (ctx.code + "-" + headline).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
  const h = hash(id);
  const comments = Array.from({ length: h % 4 }, (_, i) => {
    const [name, text] = COMMENT_POOL[(h + i * 3) % COMMENT_POOL.length];
    return { id: id + "-c" + i, name, text, ago: ((h >> (i + 2)) % 20) + 1 + "h" };
  });
  return {
    id, category, headline, original,
    points: [p1, p2],
    why,
    body:
      `${p1} ${p2} This is placeholder text for the prototype. When the app is connected to a real ` +
      `news service, this space will hold a longer, easy-to-read summary of the original article, ` +
      `written in plain English with short sentences.`,
    source: { name: SOURCES[h % SOURCES.length], url: "https://example.com/news/" + id },
    hoursAgo: (h % 23) + 1,
    score: (h % 240) + 12,
    comments,
    country: ctx.code,
    place: ctx.place || null,
    at: ctx.at,
  };
}

export const COUNTRIES = RAW.map((c) => {
  const places = c.places.map((p) => {
    const pid = c.code + "-" + p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
      id: pid, name: p.name, at: p.at, country: c.code,
      stories: p.stories.map((s) => story(s, { code: c.code, place: p.name, at: p.at })),
    };
  });
  const national = c.national.map((s) => story(s, { code: c.code, at: c.center }));
  return {
    code: c.code, name: c.name, center: c.center, places,
    stories: [...national, ...places.flatMap((p) => p.stories)],
  };
});

export const STORY_INDEX = new Map(COUNTRIES.flatMap((c) => c.stories.map((s) => [s.id, s])));
export const PLACE_INDEX = new Map(COUNTRIES.flatMap((c) => c.places.map((p) => [p.id, p])));
export const COUNTRY_INDEX = new Map(COUNTRIES.map((c) => [c.code, c]));
