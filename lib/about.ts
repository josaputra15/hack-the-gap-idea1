/** Short country blurbs for the demo. Plain English. Not live news. */
export type CountryAbout = {
  snapshot: string;
  culture: string;
  fact: string;
};

export const ABOUT: Record<string, CountryAbout> = {
  us: {
    snapshot: "The United States is a large country in North America. It has 50 states, big cities, and a lot of open land. English is the language most people use.",
    culture: "Food, music, and sports change from state to state. Baseball, basketball, and American football fill weekends. Families often gather for Thanksgiving.",
    fact: "The United States has no single official language for the whole country.",
  },
  br: {
    snapshot: "Brazil is the largest country in South America. Most people speak Portuguese. The Amazon rainforest covers a huge part of the north.",
    culture: "Music and dance are part of daily life. Samba and Carnival are famous far beyond Brazil. Football is the sport people talk about most.",
    fact: "Brazil has won the men's football World Cup five times, more than any other country.",
  },
  gb: {
    snapshot: "The United Kingdom is England, Scotland, Wales, and Northern Ireland. It is an island country in northwest Europe. London is the capital.",
    culture: "Tea, pubs, and football are part of everyday life. Theatre is a big tradition, and many famous plays still open in London.",
    fact: "The London Underground opened in 1863. It is the oldest underground railway in the world.",
  },
  ng: {
    snapshot: "Nigeria is in West Africa. More people live there than in any other African country. English is the official language, and hundreds of local languages are spoken too.",
    culture: "Films, Afrobeats, and bright cloth are known around the world. Meals are often spicy and shared with family.",
    fact: "Nigeria's film industry, called Nollywood, makes more movies each year than almost any other country.",
  },
  ke: {
    snapshot: "Kenya is in East Africa, beside the Indian Ocean. Nairobi is the capital. Many people speak English and Swahili.",
    culture: "Long-distance running is a national pride. Tea and storytelling are part of home life, and markets are busy from early morning.",
    fact: "The Great Rift Valley runs through Kenya. From the air it looks like a long crack in the earth.",
  },
  eg: {
    snapshot: "Egypt is in the northeast corner of Africa. The Mediterranean Sea is to the north. Most people live close to the Nile River.",
    culture: "Egypt is one of the oldest civilizations. Families share long meals, and visitors still come to see the pyramids and old temples.",
    fact: "The Great Pyramid at Giza is more than 4,000 years old. For a very long time it was the tallest building on earth.",
  },
  in: {
    snapshot: "India is in South Asia and has more than a billion people. It has many languages, religions, and kinds of food.",
    culture: "Festivals fill the year. Diwali, the festival of lights, is one of the biggest. Cricket is the sport people follow most.",
    fact: "India makes more films than any other country. Hindi films from Mumbai are called Bollywood.",
  },
  jp: {
    snapshot: "Japan is a chain of islands in East Asia. Trains are famous for being on time. Tokyo is one of the busiest cities in the world.",
    culture: "People often bow to say hello. Rice, noodles, and fish are everyday food. In spring, cherry blossoms bring friends outside.",
    fact: "Japan has thousands of islands, but most people live on just four of them.",
  },
  id: {
    snapshot: "Indonesia is a long line of islands in Southeast Asia. It has the fourth-largest population in the world. Bahasa Indonesia is the shared language.",
    culture: "Each island has its own dances, cloth, and recipes. Rice is eaten almost every day. Bali is known for temples and art.",
    fact: "Indonesia has more than 17,000 islands. People live on only some of them.",
  },
  au: {
    snapshot: "Australia is both a country and a continent. Most people live in cities along the coast. The middle of the country is dry and wide.",
    culture: "Beaches, barbecues, and sport shape the weekend. Aboriginal cultures are among the oldest living cultures in the world.",
    fact: "Animals such as the kangaroo and the platypus live in Australia and almost nowhere else.",
  },
  mx: {
    snapshot: "Mexico is in North America, between the United States and Central America. Spanish is the main language. Mexico City is one of the largest cities on earth.",
    culture: "Food travels well: tacos, mole, and dishes made from corn. Families gather for long meals, and music is part of almost every party.",
    fact: "Mexico City stands where Tenochtitlan stood. The Mexica people founded that city in 1325.",
  },
  de: {
    snapshot: "Germany sits in the middle of Europe. It is known for cars, trains, and strong local states. Berlin is the capital.",
    culture: "Bread, beer, and Christmas markets are part of the year. Football brings people together, and many cities have a famous club.",
    fact: "Germany is famous for hundreds of kinds of bread and hundreds of kinds of sausage.",
  },
  fr: {
    snapshot: "France is in western Europe. Paris is the capital. People take food, long meals, and design seriously.",
    culture: "Bakeries and cafes are part of the street. A baguette and cheese still follow old rules about how they should be made.",
    fact: "France is the country that welcomes the most visitors from abroad each year.",
  },
  kr: {
    snapshot: "South Korea is on a peninsula in East Asia. Seoul is a huge, fast city. The country is known for phones, cars, and pop music.",
    culture: "Meals are shared, often with many small side dishes. How you speak changes with the age of the person you are talking to.",
    fact: "A high-speed train can cross South Korea in just a few hours.",
  },
  za: {
    snapshot: "South Africa is at the southern tip of Africa. It has 11 official languages. Cape Town and Johannesburg are the cities most visitors know.",
    culture: "Music, a backyard barbecue called a braai, and sport bring people together. Rugby and football have huge crowds.",
    fact: "South Africa is the only country with three capital cities: Pretoria, Cape Town, and Bloemfontein.",
  },
  ca: {
    snapshot: "Canada is the second-largest country in the world by land. Most people live near the border with the United States. English and French are both official.",
    culture: "Ice hockey is the sport many children grow up playing. Winter festivals and maple syrup mark the colder months.",
    fact: "Canada has more lakes than any other country.",
  },
  mm: {
    snapshot: "Myanmar is in Southeast Asia, between India, China, and Thailand. Yangon is the biggest city. Many people also call the country Burma.",
    culture: "Most people are Buddhist. Friends meet in tea shops to talk. A longyi, cloth wrapped at the waist, is everyday clothing for many people.",
    fact: "The Shwedagon Pagoda in Yangon is covered in gold. It is one of the most famous buildings in the country.",
  },
};

export function countryAbout(code: string): CountryAbout | undefined {
  return ABOUT[code];
}
