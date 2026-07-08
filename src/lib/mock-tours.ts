export type FilterTag = "virtual" | "in-person" | "walking" | "food" | "nature"

export interface MockTour {
  id: string
  title: string
  location: string
  priceUsd: number
  rating: number
  reviewCount: number
  durationHours: number
  maxGuests: number
  tags: FilterTag[]
  hostName: string
  hostInitials: string
  hostBio: string
  hostRating: number
  hostVerified: boolean
  gradient: string
  description: string
  highlights: string[]
}

export const MOCK_TOURS: MockTour[] = [
  {
    id: "1",
    title: "Nairobi Street Food Safari",
    location: "Nairobi, Kenya",
    priceUsd: 27,
    rating: 4.9,
    reviewCount: 47,
    durationHours: 3,
    maxGuests: 8,
    tags: ["in-person", "food"],
    hostName: "Amina Osei",
    hostInitials: "AO",
    hostBio:
      "Born and raised in Nairobi, Amina has spent 12 years documenting the city's street food scene. She's a food writer, culinary guide, and passionate advocate for Kenya's informal food economy.",
    hostRating: 4.9,
    hostVerified: true,
    gradient: "linear-gradient(135deg, #78350f99 0%, #92400e66 100%)",
    description:
      "Dive deep into Nairobi's electric street food culture with a guide who's eaten everything this city has to offer. From smoky mishkaki skewers at Muthurwa Market to creamy mandazi and spiced chai, we'll traverse five neighbourhoods and 12 stops across three hours. You'll hear the stories of the vendors, taste dishes handed down through generations, and come away with a full belly and a new understanding of why Nairobi is East Africa's most exciting food city.",
    highlights: [
      "12 food tastings across 5 neighbourhoods",
      "Behind-the-scenes vendor introductions",
      "Exclusive recipe card for Kenyan street chai",
      "Small group — maximum 8 guests",
      "Bottled water and wet wipes provided",
    ],
  },
  {
    id: "2",
    title: "Maasai Mara Wildlife Virtual Tour",
    location: "Maasai Mara, Kenya",
    priceUsd: 12,
    rating: 4.8,
    reviewCount: 112,
    durationHours: 1.5,
    maxGuests: 20,
    tags: ["virtual", "nature"],
    hostName: "David Kimani",
    hostInitials: "DK",
    hostBio:
      "David is a certified wildlife guide with 15 years in the Mara ecosystem. He streams live from the reserve every morning, giving online guests real-time wildlife encounters they won't find anywhere else.",
    hostRating: 4.8,
    hostVerified: true,
    gradient: "linear-gradient(135deg, #14532d99 0%, #16653466 100%)",
    description:
      "Join David live from the heart of the Maasai Mara for an immersive 90-minute virtual safari. Using a high-definition 360° camera rig mounted on his Land Cruiser, you'll spot lions, elephants, zebra, and — if the season is right — wildebeest in their millions crossing the Mara River. David narrates every sighting with expert commentary and answers your questions in real time. Sessions run at dawn and dusk to catch the most active hours.",
    highlights: [
      "Live HD stream from inside the Mara",
      "Real-time Q&A with your guide",
      "Dawn and dusk sessions available",
      "Recording available for 48 hours",
      "Certificate of participation included",
    ],
  },
  {
    id: "3",
    title: "Lamu Old Town Heritage Walk",
    location: "Lamu, Kenya",
    priceUsd: 31,
    rating: 5.0,
    reviewCount: 28,
    durationHours: 2.5,
    maxGuests: 6,
    tags: ["in-person", "walking"],
    hostName: "Fatima Hassan",
    hostInitials: "FH",
    hostBio:
      "Fatima is a seventh-generation Lamu resident and trained archaeologist. Her family has lived in the same coral-stone house for 200 years. Her walks bring the living history of Swahili civilisation to life like no book or documentary can.",
    hostRating: 5.0,
    hostVerified: true,
    gradient: "linear-gradient(135deg, #1e3a5f99 0%, #1e3a8a66 100%)",
    description:
      "Lamu Old Town is the oldest continuously inhabited Swahili settlement in East Africa and a UNESCO World Heritage Site. Walk its labyrinthine alleys with Fatima, whose family lineage traces the town's 700-year history. You'll visit intricately carved wooden doorways, a 19th-century mosque open to respectful visitors, the old fort, the donkey sanctuary, and the bustling waterfront. Fatima's storytelling bridges the gap between past and present with warmth and scholarly depth.",
    highlights: [
      "UNESCO World Heritage Site access",
      "Visit to a historic family coral-stone house",
      "Traditional Swahili refreshments included",
      "Maximum 6 guests for intimate experience",
      "Illustrated heritage map keepsake",
    ],
  },
  {
    id: "4",
    title: "Mount Kenya Sunrise Hike",
    location: "Mount Kenya, Kenya",
    priceUsd: 65,
    rating: 4.7,
    reviewCount: 19,
    durationHours: 8,
    maxGuests: 4,
    tags: ["in-person", "nature"],
    hostName: "James Mwangi",
    hostInitials: "JM",
    hostBio:
      "James has summited Point Lenana over 200 times. A certified mountain rescue technician, he brings safety-first professionalism to every ascent without sacrificing the wonder of being above the clouds.",
    hostRating: 4.7,
    hostVerified: false,
    gradient: "linear-gradient(135deg, #1e293b99 0%, #33415566 100%)",
    description:
      "Depart from Chogoria Gate at 2 AM and reach Point Lenana — 4,985 m above sea level — just in time to watch the sun rise over the African plains below. James guides you through moorland, giant lobelias, and frozen tarns to reach one of the most dramatic viewpoints on the continent. The hike is challenging but suitable for fit beginners with trekking poles and the right layers. All safety equipment and a warm breakfast at the summit hut are included.",
    highlights: [
      "Summit at Point Lenana (4,985 m)",
      "All safety equipment provided",
      "Warm breakfast at summit hut",
      "Maximum 4 guests for safety",
      "Private transport from Nairobi available",
    ],
  },
  {
    id: "5",
    title: "Mombasa Old Town Night Walk",
    location: "Mombasa, Kenya",
    priceUsd: 22,
    rating: 4.6,
    reviewCount: 34,
    durationHours: 2,
    maxGuests: 10,
    tags: ["in-person", "walking"],
    hostName: "Hassan Ali",
    hostInitials: "HA",
    hostBio:
      "Hassan grew up in Fort Jesus's shadow and now leads cultural walks that illuminate the layered Arab, Portuguese, British, and Swahili heritage of Mombasa. He's funny, encyclopaedic, and knows every lantern-lit corner of the Old Town.",
    hostRating: 4.6,
    hostVerified: true,
    gradient: "linear-gradient(135deg, #3b0764aa 0%, #4c1d9566 100%)",
    description:
      "As the sun sets over the Indian Ocean, Mombasa's Old Town transforms into a place of golden light and whispered history. Hassan leads you through winding alleys lined with carved Arab doorways, past the imposing Portuguese Fort Jesus, and into courtyards where locals gather for evening chai. You'll hear stories of pirates, traders, and warriors, and finish the walk with a tasting of Swahili coconut rice and spiced tea at a family-run eatery.",
    highlights: [
      "Fort Jesus exterior with expert narration",
      "Spiced chai and coconut rice tasting",
      "Lantern-lit alley photography spots",
      "Stories of Arab, Portuguese & British history",
      "Small group — maximum 10 guests",
    ],
  },
  {
    id: "6",
    title: "Virtual Kenyan Home Cooking Class",
    location: "Kisumu, Kenya",
    priceUsd: 18,
    rating: 4.9,
    reviewCount: 63,
    durationHours: 2,
    maxGuests: 15,
    tags: ["virtual", "food"],
    hostName: "Grace Otieno",
    hostInitials: "GO",
    hostBio:
      "Grace is a home cook, cookbook author, and passionate preserver of Luo culinary traditions. Her virtual classes have reached participants in 42 countries, and she makes every session feel like cooking with your favourite auntie.",
    hostRating: 4.9,
    hostVerified: true,
    gradient: "linear-gradient(135deg, #7f1d1d99 0%, #9f1c1c66 100%)",
    description:
      "Log in from your own kitchen and cook alongside Grace as she walks you through a full Kenyan lakeside meal from Kisumu. You'll prepare fresh tilapia in tomato-herb sauce, ugali from scratch, and a refreshing sukuma wiki side. Grace shares the cultural significance of each dish and the farming families behind the ingredients. You'll need a simple ingredient list sent in advance — everything is accessible at any supermarket worldwide.",
    highlights: [
      "Cook 3-course Kenyan lakeside meal",
      "Ingredient list sent 48 hrs in advance",
      "Recipe PDF and video recording included",
      "Live Q&A throughout the session",
      "Suitable for all cooking skill levels",
    ],
  },
  {
    id: "7",
    title: "Amboseli Elephant Sanctuary Tour",
    location: "Amboseli, Kenya",
    priceUsd: 55,
    rating: 4.8,
    reviewCount: 41,
    durationHours: 4,
    maxGuests: 6,
    tags: ["in-person", "nature"],
    hostName: "Peter Nderitu",
    hostInitials: "PN",
    hostBio:
      "Peter is a wildlife conservationist who has worked with the Amboseli Elephant Research Project for a decade. He can identify over 300 individual elephants by sight and tells their stories with extraordinary care.",
    hostRating: 4.8,
    hostVerified: true,
    gradient: "linear-gradient(135deg, #134e4a99 0%, #0f636466 100%)",
    description:
      "Step into Amboseli National Park with Peter for a four-hour guided experience focused entirely on Kenya's largest elephant herds, set against the snow-capped backdrop of Kilimanjaro. Peter's decade of research means you'll learn each family group's name, hierarchy, and history. You'll also visit a Maasai community boma where local herders share how they coexist — and sometimes conflict — with these magnificent animals. Sunrise and afternoon slots are available.",
    highlights: [
      "Guided elephant tracking with researcher",
      "Kilimanjaro backdrop photography",
      "Maasai boma community visit",
      "Conservation fee included in price",
      "Maximum 6 guests for low impact",
    ],
  },
  {
    id: "8",
    title: "Nairobi CBD Street Art Walk",
    location: "Nairobi, Kenya",
    priceUsd: 15,
    rating: 4.5,
    reviewCount: 22,
    durationHours: 2,
    maxGuests: 12,
    tags: ["in-person", "walking"],
    hostName: "Shiro Kamau",
    hostInitials: "SK",
    hostBio:
      "Shiro is a muralist and urban art curator who has painted five of Nairobi's most-photographed walls. Her walks celebrate the artists who are transforming the city's concrete into canvas.",
    hostRating: 4.5,
    hostVerified: false,
    gradient: "linear-gradient(135deg, #701a7599 0%, #86198f66 100%)",
    description:
      "Nairobi's streets have become an open-air gallery — and Shiro knows every brushstroke. On this two-hour walk through the CBD and River Road, you'll encounter towering murals, hidden stencil art, and yarn-bombing installations created by Kenya's most exciting young artists. Shiro shares the political and social commentary embedded in each work and introduces you to the grassroots art collectives changing the face of the city. Bring your camera — every corner is a photo opportunity.",
    highlights: [
      "15+ murals by named Kenyan artists",
      "Access to artists' studios where open",
      "Photography tips for street art shots",
      "Complimentary art print from local artist",
      "Optional post-walk gallery visit",
    ],
  },
  {
    id: "9",
    title: "Virtual Maasai Culture Immersion",
    location: "Kajiado, Kenya",
    priceUsd: 14,
    rating: 4.7,
    reviewCount: 89,
    durationHours: 1.5,
    maxGuests: 25,
    tags: ["virtual"],
    hostName: "Ole Senteu",
    hostInitials: "OS",
    hostBio:
      "Ole Senteu is a Maasai elder's son and cultural ambassador who has shared his community's traditions with audiences worldwide. He live-streams from a traditional manyatta homestead and teaches through story, song, and ceremony.",
    hostRating: 4.7,
    hostVerified: true,
    gradient: "linear-gradient(135deg, #78350f99 0%, #92400e66 100%)",
    description:
      "Join Ole Senteu live from inside a traditional Maasai homestead in Kajiado for a 90-minute cultural immersion. You'll witness a morning blessing ceremony, learn the meaning of Maasai beadwork colour codes, hear warrior stories, and share a virtual cup of fermented milk in the spirit of Maasai hospitality. Ole answers questions openly and bridges his ancient culture with contemporary life — addressing both what has stayed the same and what is changing.",
    highlights: [
      "Live morning blessing ceremony",
      "Maasai beadwork colour-code lesson",
      "Warrior storytelling tradition",
      "Cultural Q&A with an elder's son",
      "Digital beadwork pattern guide included",
    ],
  },
  {
    id: "10",
    title: "Diani Beach Seafood & Snorkelling",
    location: "Diani Beach, Kenya",
    priceUsd: 75,
    rating: 4.9,
    reviewCount: 56,
    durationHours: 5,
    maxGuests: 6,
    tags: ["in-person", "food", "nature"],
    hostName: "Aisha Mwangi",
    hostInitials: "AM",
    hostBio:
      "Aisha grew up diving the Diani reef and now runs the coast's most beloved boat-to-table experience. She combines marine biology knowledge with her mother's legendary seafood recipes for an unforgettable five hours.",
    hostRating: 4.9,
    hostVerified: true,
    gradient: "linear-gradient(135deg, #0c4a6e99 0%, #1e3a8a66 100%)",
    description:
      "Board Aisha's traditional dhow at sunrise and sail to the coral gardens of Diani Marine National Reserve for a guided snorkelling session among sea turtles, parrotfish, and octopus. After two hours in the water, you'll return to shore where Aisha and her team prepare a fresh seafood feast — grilled crab, coconut prawn curry, and whole fish — under a shaded beach banda. The afternoon is yours to relax on one of Kenya's finest beaches. All snorkelling equipment provided.",
    highlights: [
      "Traditional dhow sunrise sailing",
      "Guided snorkelling in marine reserve",
      "Fresh seafood feast prepared on shore",
      "All snorkelling gear provided",
      "Maximum 6 guests for personal experience",
    ],
  },
  {
    id: "11",
    title: "Karen Blixen Museum & Coffee Tour",
    location: "Karen, Nairobi",
    priceUsd: 35,
    rating: 4.6,
    reviewCount: 30,
    durationHours: 3,
    maxGuests: 8,
    tags: ["in-person", "walking", "food"],
    hostName: "Lucy Njeri",
    hostInitials: "LN",
    hostBio:
      "Lucy is a historian specialising in colonial and post-colonial Nairobi and a certified coffee sommelier who trained on the slopes of Mt Kenya. Her tours connect literature, landscape, and Kenya's world-class coffee in one elegant afternoon.",
    hostRating: 4.6,
    hostVerified: true,
    gradient: "linear-gradient(135deg, #1a3a1a99 0%, #14532d66 100%)",
    description:
      "Walk through the house and gardens of Karen Blixen — author of Out of Africa — with Lucy as your literary and historical guide. After an hour exploring the museum, the tour moves to a boutique coffee farm on the Ngong Hills where you'll taste three single-origin Kenyan roasts while overlooking the Rift Valley. Lucy's storytelling weaves together Blixen's complicated legacy, the colonial history of the land, and Kenya's proud position as home to some of the world's finest Arabica beans.",
    highlights: [
      "Karen Blixen Museum guided tour",
      "Single-origin coffee tasting on farm",
      "Ngong Hills Rift Valley views",
      "Coffee processing demo from cherry to cup",
      "250g specialty coffee bag to take home",
    ],
  },
  {
    id: "12",
    title: "Virtual Tsavo Wildlife Safari",
    location: "Tsavo, Kenya",
    priceUsd: 10,
    rating: 4.5,
    reviewCount: 77,
    durationHours: 1,
    maxGuests: 30,
    tags: ["virtual", "nature"],
    hostName: "Michael Kioko",
    hostInitials: "MK",
    hostBio:
      "Michael is a Tsavo East ranger turned wildlife communicator. He streams twice daily from a waterhole camera network and brings the drama of Africa's largest national park directly to your screen.",
    hostRating: 4.5,
    hostVerified: false,
    gradient: "linear-gradient(135deg, #7c2d1299 0%, #7f1d1d66 100%)",
    description:
      "Tsavo East is Kenya's largest national park and home to the famous red elephants — coated in the park's distinctive red dust. Michael hosts a one-hour live broadcast from a network of waterhole cameras, giving you front-row views of elephants, lions, leopards, and hundreds of bird species from the comfort of wherever you are in the world. Sessions are unscripted and wild — the animals set the agenda. Michael's park ranger training means he catches things an untrained eye would miss.",
    highlights: [
      "Live waterhole multi-camera broadcast",
      "Red elephant herds of Tsavo East",
      "Expert ranger commentary",
      "On-demand replay for 24 hours",
      "Affordable entry-level safari experience",
    ],
  },
]
