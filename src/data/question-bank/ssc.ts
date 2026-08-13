import type { BankSeed } from "./types";

/**
 * SSC sheet, following the Tier-1 section split: Quantitative Aptitude,
 * General Intelligence & Reasoning, English Comprehension and General
 * Awareness, 25 questions each in the real paper. Tier 1 allows 60 minutes for
 * 100 questions, so the expected solve times here are deliberately tight —
 * speed is the actual skill being trained.
 */
export const sscBank: BankSeed[] = [
  // --------------------------------------------------- Quantitative Aptitude
  {
    slug: "ssc-quant-markup-discount-profit",
    examType: "SSC_CGL",
    subject: "Quantitative Aptitude",
    chapter: "Profit, Loss and Discount",
    topic: "Successive markup and discount",
    type: "numeric",
    difficulty: "easy",
    content:
      "A shopkeeper marks his goods 40% above cost price and then allows a discount of 15% on the marked price. Find his profit percentage.",
    correctAnswer: "19%",
    solution:
      "Take CP = 100. MP = 140. SP = 140 × 0.85 = 119.\nProfit = 119 − 100 = 19, so profit% = 19%.\nShortcut worth memorising: net effect of +x% then −y% is x − y − xy/100 = 40 − 15 − 6 = 19%.",
    hint: "Assume CP = 100 — percentage problems almost always collapse when you do.",
    expectedMinutes: 2,
    tags: ["percentage", "shortcut"],
  },
  {
    slug: "ssc-quant-time-work-a-leaves",
    examType: "SSC_CGL",
    subject: "Quantitative Aptitude",
    chapter: "Time and Work",
    topic: "Combined work with one worker leaving",
    type: "numeric",
    difficulty: "medium",
    content:
      "A can complete a piece of work in 12 days and B in 15 days. They start together, but A leaves after 4 days. In how many more days will B finish the remaining work?",
    correctAnswer: "6 days",
    solution:
      "Take the total work as LCM(12, 15) = 60 units. A does 5 units/day, B does 4 units/day.\nWorking together for 4 days: (5 + 4) × 4 = 36 units done.\nRemaining = 60 − 36 = 24 units.\nB alone needs 24/4 = 6 more days.",
    hint: "Use the LCM-of-days method to make every rate a whole number — it removes fractions entirely.",
    expectedMinutes: 2,
    tags: ["LCM-method", "efficiency"],
  },
  {
    slug: "ssc-quant-train-crosses-platform",
    examType: "SSC_CGL",
    subject: "Quantitative Aptitude",
    chapter: "Time, Speed and Distance",
    topic: "Trains",
    type: "numeric",
    difficulty: "easy",
    content:
      "A train 150 m long crosses a platform 350 m long in 25 seconds. Find the speed of the train in km/h.",
    correctAnswer: "72 km/h",
    solution:
      "To cross a platform the train covers its own length plus the platform's: 150 + 350 = 500 m.\nSpeed = 500/25 = 20 m/s.\nConvert: 20 × 18/5 = 72 km/h.",
    hint: "Crossing a pole covers only the train's length; crossing a platform covers both.",
    expectedMinutes: 2,
    tags: ["trains", "unit-conversion"],
  },
  {
    slug: "ssc-quant-alligation-water-milk",
    examType: "SSC_CGL",
    subject: "Quantitative Aptitude",
    chapter: "Mixture and Alligation",
    topic: "Adding a free ingredient",
    type: "numeric",
    difficulty: "medium",
    content:
      "In what ratio must water be mixed with milk costing ₹60 per litre so that, by selling the mixture at ₹60 per litre, the trader gains 20%?",
    correctAnswer: "1 : 5 (water : milk)",
    solution:
      "Selling at ₹60 with a 20% gain means the cost price of the mixture is 60/1.2 = ₹50 per litre.\nWater costs ₹0, milk costs ₹60. By alligation:\nwater : milk = (60 − 50) : (50 − 0) = 10 : 50 = 1 : 5.\nSo 1 litre of water for every 5 litres of milk.",
    hint: "First convert the required profit into the cost price of the *mixture* — that is the alligation mean.",
    expectedMinutes: 3,
    tags: ["alligation", "profit"],
  },
  {
    slug: "ssc-quant-ci-si-difference",
    examType: "SSC_CGL",
    subject: "Quantitative Aptitude",
    chapter: "Simple and Compound Interest",
    topic: "Difference between CI and SI",
    type: "numeric",
    difficulty: "easy",
    content:
      "Find the difference between the compound interest and the simple interest on ₹10,000 at 10% per annum for 2 years, compounded annually.",
    correctAnswer: "₹100",
    solution:
      "SI = 10000 × 10 × 2/100 = ₹2000.\nCI = 10000[(1.1)² − 1] = 10000(0.21) = ₹2100.\nDifference = ₹100.\nStandard formula for 2 years: difference = P(r/100)² = 10000 × (0.1)² = ₹100. It arises because compound interest earns interest on the first year's interest.",
    expectedMinutes: 2,
    tags: ["formula", "shortcut"],
  },
  {
    slug: "ssc-quant-cylinder-volume-change",
    examType: "SSC_CGL",
    subject: "Quantitative Aptitude",
    chapter: "Mensuration",
    topic: "Percentage change in volume",
    type: "numeric",
    difficulty: "medium",
    content:
      "The radius of a cylinder is increased by 20% and its height is decreased by 20%. Find the percentage change in its volume.",
    correctAnswer: "Increase of 15.2%",
    solution:
      "V = πr²h, so V ∝ r²h.\nNew volume factor = (1.2)² × (0.8) = 1.44 × 0.8 = 1.152.\nChange = +15.2%.\nThe result is not zero because the radius enters squared — a 20% rise in r raises r² by 44%, which more than offsets the 20% fall in h.",
    hint: "Squaring the radius change is the whole trick; the two 20%s do not cancel.",
    expectedMinutes: 2,
    tags: ["percentage-change", "mensuration"],
  },
  {
    slug: "ssc-quant-average-overlapping-groups",
    examType: "SSC_CGL",
    subject: "Quantitative Aptitude",
    chapter: "Average",
    topic: "Overlapping groups",
    type: "numeric",
    difficulty: "medium",
    content:
      "The average of 11 numbers is 50. The average of the first six is 49 and the average of the last six is 52. Find the sixth number.",
    correctAnswer: "56",
    solution:
      "Sum of all 11 = 11 × 50 = 550.\nSum of first six = 6 × 49 = 294. Sum of last six = 6 × 52 = 312.\nAdding these two counts the sixth number twice: 294 + 312 = 606.\nSixth number = 606 − 550 = 56.",
    hint: "Six plus six is twelve, but there are only eleven numbers — the overlap is the answer.",
    expectedMinutes: 2,
    tags: ["averages", "overlap"],
  },
  {
    slug: "ssc-quant-algebra-x-cubed-identity",
    examType: "SSC_CGL",
    subject: "Quantitative Aptitude",
    chapter: "Algebra",
    topic: "Standard identities",
    type: "numeric",
    difficulty: "easy",
    content: "If x + 1/x = 5, find the value of x³ + 1/x³ and of x² + 1/x².",
    correctAnswer: "x³ + 1/x³ = 110; x² + 1/x² = 23",
    solution:
      "x² + 1/x² = (x + 1/x)² − 2 = 25 − 2 = 23.\nx³ + 1/x³ = (x + 1/x)³ − 3(x + 1/x) = 125 − 15 = 110.\nBoth follow from expanding the power of the binomial and subtracting the cross terms — worth committing to memory, since SSC uses these identities constantly.",
    expectedMinutes: 2,
    tags: ["identities", "shortcut"],
  },

  // ------------------------------------------ General Intelligence & Reasoning
  {
    slug: "ssc-reason-number-series-cubes",
    examType: "SSC_CGL",
    subject: "General Intelligence and Reasoning",
    chapter: "Number Series",
    topic: "Cube-based series",
    type: "numeric",
    difficulty: "easy",
    content: "Find the next term in the series: 7, 26, 63, 124, 215, ?",
    correctAnswer: "342",
    solution:
      "Each term is one less than a perfect cube:\n2³ − 1 = 7, 3³ − 1 = 26, 4³ − 1 = 63, 5³ − 1 = 124, 6³ − 1 = 215.\nNext: 7³ − 1 = 343 − 1 = 342.",
    hint: "Compare each term with the nearby cubes and squares before trying differences.",
    expectedMinutes: 1,
    tags: ["series", "cubes"],
  },
  {
    slug: "ssc-reason-coding-letter-shift",
    examType: "SSC_CGL",
    subject: "General Intelligence and Reasoning",
    chapter: "Coding-Decoding",
    topic: "Letter shift",
    type: "short_answer",
    difficulty: "easy",
    content:
      "In a certain code TEACHER is written as VGCEJGT. How is STUDENT written in the same code?",
    correctAnswer: "UVWFGPV",
    solution:
      "Each letter moves forward by two positions: T→V, E→G, A→C, C→E, H→J, E→G, R→T. ✓\nApplying the same +2 shift to STUDENT:\nS→U, T→V, U→W, D→F, E→G, N→P, T→V, giving UVWFGPV.",
    expectedMinutes: 1,
    tags: ["coding", "alphabet-positions"],
  },
  {
    slug: "ssc-reason-blood-relation-photograph",
    examType: "SSC_CGL",
    subject: "General Intelligence and Reasoning",
    chapter: "Blood Relations",
    topic: "Photograph puzzles",
    type: "short_answer",
    difficulty: "medium",
    content:
      "Pointing to a photograph, a man said, \"She is the daughter of my grandfather's only son.\" How is the woman in the photograph related to the man?",
    correctAnswer: "She is his sister.",
    solution:
      "Work outward from the innermost relation: 'my grandfather's only son' must be the man's own father (the grandfather has exactly one son, and the man descends from him).\nSo she is the daughter of the man's father — his sister.",
    hint: "Always resolve the innermost phrase first, then substitute it back into the sentence.",
    expectedMinutes: 2,
    tags: ["blood-relations"],
  },
  {
    slug: "ssc-reason-direction-sense-return",
    examType: "SSC_CGL",
    subject: "General Intelligence and Reasoning",
    chapter: "Direction Sense",
    topic: "Displacement",
    type: "short_answer",
    difficulty: "easy",
    content:
      "A man walks 5 km north, then turns right and walks 3 km, then turns right again and walks 5 km. How far is he from his starting point, and in which direction?",
    correctAnswer: "3 km, to the east of the starting point",
    solution:
      "Start facing north and walk 5 km north.\nTurning right faces him east; he walks 3 km east.\nTurning right again faces him south; he walks 5 km south, exactly cancelling the first leg.\nNet displacement is 3 km due east. Sketching the path makes the cancellation obvious.",
    expectedMinutes: 1,
    tags: ["directions", "displacement"],
  },
  {
    slug: "ssc-reason-syllogism-pens-books",
    examType: "SSC_CGL",
    subject: "General Intelligence and Reasoning",
    chapter: "Syllogism",
    topic: "Two-statement syllogism",
    type: "short_answer",
    difficulty: "medium",
    content:
      "Statements: All pens are books. Some books are red.\nConclusions: I. Some pens are red. II. Some books are pens.\nWhich conclusion(s) follow?",
    correctAnswer: "Only conclusion II follows.",
    solution:
      "Draw the Venn diagram: the 'pens' circle lies entirely inside 'books'. The 'red' circle overlaps 'books' somewhere.\nConclusion I does not follow: the overlap between books and red may lie entirely in the part of 'books' outside 'pens'. It is *possible* but not certain, and syllogism demands certainty.\nConclusion II does follow: since all pens are books and pens exist, some books are necessarily pens — this is the valid conversion of a universal affirmative into a particular affirmative.",
    hint: "A conclusion only 'follows' if it is true in every possible diagram, not merely in one.",
    expectedMinutes: 2,
    tags: ["venn-diagram", "logic"],
  },
  {
    slug: "ssc-reason-venn-doctors-surgeons-women",
    examType: "SSC_CGL",
    subject: "General Intelligence and Reasoning",
    chapter: "Venn Diagrams",
    topic: "Class relationships",
    type: "short_answer",
    difficulty: "medium",
    content:
      "Describe the Venn diagram that correctly represents the relationship among: Doctors, Surgeons, Women.",
    correctAnswer:
      "'Surgeons' entirely inside 'Doctors'; 'Women' as a separate circle intersecting both.",
    solution:
      "Every surgeon is a doctor, so 'Surgeons' is a proper subset of 'Doctors' — one circle wholly inside the other.\n'Women' is an independent classification: some women are doctors, some of those are surgeons, and many women are neither. So the 'Women' circle must partially overlap both the doctors circle and the surgeons region, while also extending outside them.\nThe result is two concentric-style circles (surgeons within doctors) cut across by a third overlapping circle.",
    hint: "Ask, for each pair: is one wholly contained in the other, wholly separate, or partly overlapping?",
    expectedMinutes: 2,
    tags: ["venn-diagram", "classification"],
  },

  // ---------------------------------------------------- English Comprehension
  {
    slug: "ssc-eng-error-one-of-my-friends",
    examType: "SSC_CGL",
    subject: "English Comprehension",
    chapter: "Error Spotting",
    topic: "Subject-verb agreement",
    type: "short_answer",
    difficulty: "easy",
    content:
      "Identify the error and correct it: \"One of my friend / who lives in Delhi / is coming tomorrow.\"",
    correctAnswer:
      "'One of my friend' should be 'One of my friends' — 'one of' takes a plural noun.",
    solution:
      "The construction 'one of' is always followed by a plural noun, because you are selecting one member out of a group: one of my friends, one of the students, one of these books.\nThe verb, however, stays singular and agrees with 'one': 'One of my friends ... is coming' is correct.\nThe relative clause 'who lives in Delhi' is also correct here, since 'who' refers to 'one'.",
    hint: "Separate the two agreements: the noun after 'of' is plural, but the main verb agrees with 'one'.",
    expectedMinutes: 1,
    tags: ["grammar", "agreement"],
  },
  {
    slug: "ssc-eng-idiom-beat-about-the-bush",
    examType: "SSC_CGL",
    subject: "English Comprehension",
    chapter: "Idioms and Phrases",
    topic: "Common idioms",
    type: "short_answer",
    difficulty: "easy",
    content:
      "Give the meaning of the idiom 'to beat about the bush' and use it correctly in a sentence.",
    correctAnswer:
      "To avoid coming to the main point; to speak evasively.",
    solution:
      "Meaning: to talk around a subject without addressing it directly, usually to delay or avoid an uncomfortable point.\nSentence: 'Stop beating about the bush and tell me whether you can finish the report by Friday.'\nRelated idioms often tested alongside it: 'to call a spade a spade' (to speak plainly), 'to let the cat out of the bag' (to reveal a secret).",
    expectedMinutes: 1,
    tags: ["idioms", "vocabulary"],
  },
  {
    slug: "ssc-eng-preposition-suffering-from",
    examType: "SSC_CGL",
    subject: "English Comprehension",
    chapter: "Prepositions",
    topic: "Verb-preposition collocation",
    type: "short_answer",
    difficulty: "easy",
    content:
      "Fill in the blank with the correct preposition and justify: \"He has been suffering ____ fever since Monday.\"",
    correctAnswer: "from",
    solution:
      "'Suffer from' is the fixed collocation used with illnesses: suffering from fever, from malaria, from a headache.\n'Suffer' without a preposition takes a direct object of a different kind — one suffers a loss, a defeat, an injury.\nNote also the tense: 'has been suffering ... since Monday' is present perfect continuous, which is correct with 'since' for an action beginning at a point in the past and still continuing.",
    expectedMinutes: 1,
    tags: ["prepositions", "collocation"],
  },
  {
    slug: "ssc-eng-active-passive-present-continuous",
    examType: "SSC_CGL",
    subject: "English Comprehension",
    chapter: "Active and Passive Voice",
    topic: "Present continuous",
    type: "short_answer",
    difficulty: "easy",
    content:
      "Change into the passive voice: \"The teacher is explaining the lesson.\"",
    correctAnswer: "The lesson is being explained by the teacher.",
    solution:
      "Present continuous active (is/are + V-ing) becomes 'is/are + being + past participle' in the passive.\nThe object 'the lesson' becomes the subject; the verb becomes 'is being explained'; the original subject moves to a 'by' phrase.\nA frequent error is writing 'is explained' — that is simple present passive and loses the continuous aspect.",
    expectedMinutes: 1,
    tags: ["voice", "transformation"],
  },
  {
    slug: "ssc-eng-one-word-substitution",
    examType: "SSC_CGL",
    subject: "English Comprehension",
    chapter: "One Word Substitution",
    topic: "Common substitutions",
    type: "short_answer",
    difficulty: "easy",
    content:
      "Give one word for each: (a) a person who does not believe in the existence of God (b) a speech made without preparation (c) one who is present everywhere (d) a government by the wealthy.",
    correctAnswer: "(a) atheist (b) extempore / impromptu (c) omnipresent (d) plutocracy",
    solution:
      "(a) atheist — contrast with agnostic (one who holds that the existence of God is unknowable) and theist (a believer).\n(b) extempore or impromptu — a speech delivered on the spur of the moment.\n(c) omnipresent — related: omniscient (all-knowing), omnipotent (all-powerful).\n(d) plutocracy — related government forms: aristocracy (by the nobility), autocracy (by one person), oligarchy (by a small group), theocracy (by religious authority).",
    hint: "Learn these in contrasting sets — SSC almost always tests the near-miss word alongside the right one.",
    expectedMinutes: 2,
    tags: ["vocabulary", "one-word"],
  },

  // ------------------------------------------------------- General Awareness
  {
    slug: "ssc-ga-fundamental-rights",
    examType: "SSC_CGL",
    subject: "General Awareness",
    chapter: "Indian Polity",
    topic: "Fundamental Rights",
    type: "short_answer",
    difficulty: "medium",
    content:
      "Which part and articles of the Indian Constitution deal with Fundamental Rights? Name the six categories with their article ranges, and identify the right Dr Ambedkar called the 'heart and soul' of the Constitution.",
    correctAnswer:
      "Part III, Articles 12–35. Six categories; Article 32 (Right to Constitutional Remedies) is the 'heart and soul'.",
    solution:
      "Fundamental Rights are in Part III, Articles 12–35:\n1. Right to Equality — Articles 14–18\n2. Right to Freedom — Articles 19–22\n3. Right against Exploitation — Articles 23–24\n4. Right to Freedom of Religion — Articles 25–28\n5. Cultural and Educational Rights — Articles 29–30\n6. Right to Constitutional Remedies — Article 32\nDr B. R. Ambedkar called Article 32 the 'heart and soul' of the Constitution, because it makes the other rights enforceable — it empowers a citizen to move the Supreme Court directly through writs.\nNote the Right to Property was originally the seventh Fundamental Right (Article 31) but was removed by the 44th Amendment (1978) and is now only a legal right under Article 300A.",
    expectedMinutes: 3,
    tags: ["polity", "constitution", "high-yield"],
  },
  {
    slug: "ssc-ga-purna-swaraj-lahore",
    examType: "SSC_CGL",
    subject: "General Awareness",
    chapter: "Modern Indian History",
    topic: "Freedom struggle",
    type: "short_answer",
    difficulty: "medium",
    content:
      "At which session of the Indian National Congress was the Purna Swaraj resolution adopted? Give the year, the president of that session, and the date first observed as Independence Day.",
    correctAnswer:
      "Lahore session, December 1929, presided over by Jawaharlal Nehru; 26 January 1930 was observed as Purna Swaraj (Independence) Day.",
    solution:
      "The Lahore session of December 1929, with Jawaharlal Nehru as president, adopted the resolution declaring Purna Swaraj (complete independence) as the Congress's goal, replacing the earlier demand for dominion status.\nThe Congress called on people to observe 26 January 1930 as Independence Day, and the tricolour was unfurled on the banks of the Ravi.\nThis date is why the Constitution was brought into force on 26 January 1950 — chosen deliberately to commemorate the 1930 pledge.",
    expectedMinutes: 2,
    tags: ["history", "INC-sessions", "high-yield"],
  },
  {
    slug: "ssc-ga-tropic-of-cancer-states",
    examType: "SSC_CGL",
    subject: "General Awareness",
    chapter: "Indian Geography",
    topic: "Latitudes",
    type: "short_answer",
    difficulty: "medium",
    content:
      "Name the eight Indian states through which the Tropic of Cancer passes, from west to east.",
    correctAnswer:
      "Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura, Mizoram",
    solution:
      "West to east: Gujarat → Rajasthan → Madhya Pradesh → Chhattisgarh → Jharkhand → West Bengal → Tripura → Mizoram.\nA common mnemonic is 'Gujarat Rajasthan Made Christmas Just With Tea and Milk'.\nThe Tropic of Cancer lies at about 23°30′ N and roughly bisects India, which is why the country has both tropical and subtropical climates.",
    hint: "Note that Madhya Pradesh has the longest stretch of the line, and that it does *not* pass through Bihar or Odisha.",
    expectedMinutes: 2,
    tags: ["geography", "map-based"],
  },
  {
    slug: "ssc-ga-vitamin-deficiency-diseases",
    examType: "SSC_CGL",
    subject: "General Awareness",
    chapter: "General Science",
    topic: "Vitamins and deficiency diseases",
    type: "short_answer",
    difficulty: "easy",
    content:
      "Name the vitamin whose deficiency causes each of: scurvy, beriberi, rickets, night blindness and pernicious anaemia. Give the chemical name of each vitamin.",
    correctAnswer:
      "Scurvy — vitamin C (ascorbic acid); beriberi — B1 (thiamine); rickets — D (calciferol); night blindness — A (retinol); pernicious anaemia — B12 (cyanocobalamin).",
    solution:
      "• Scurvy — vitamin C, ascorbic acid. Bleeding gums, poor wound healing; water-soluble.\n• Beriberi — vitamin B1, thiamine. Affects nerves and the heart.\n• Rickets — vitamin D, calciferol. Soft, deformed bones in children (osteomalacia in adults); fat-soluble and synthesised in skin under sunlight.\n• Night blindness — vitamin A, retinol. Also causes xerophthalmia; fat-soluble.\n• Pernicious anaemia — vitamin B12, cyanocobalamin. The only vitamin containing a metal (cobalt).\nFat-soluble vitamins are A, D, E and K; the rest are water-soluble, which is why deficiencies in B and C appear faster — the body cannot store them.",
    expectedMinutes: 2,
    tags: ["science", "biology", "high-yield"],
  },
  {
    slug: "ssc-ga-fiscal-vs-revenue-deficit",
    examType: "SSC_CGL",
    subject: "General Awareness",
    chapter: "Indian Economy",
    topic: "Budget and deficits",
    type: "short_answer",
    difficulty: "medium",
    content:
      "Distinguish between fiscal deficit, revenue deficit and primary deficit, giving the formula for each. Which one indicates the total borrowing requirement of the government?",
    correctAnswer:
      "Fiscal deficit = total expenditure − total receipts excluding borrowings; it measures the total borrowing requirement.",
    solution:
      "Revenue deficit = revenue expenditure − revenue receipts. It signals that the government is borrowing to meet its day-to-day running costs, which creates no asset — generally regarded as the least healthy deficit.\nFiscal deficit = total expenditure − total receipts excluding borrowings. This is the government's total borrowing requirement for the year, and the headline number in the Union Budget.\nPrimary deficit = fiscal deficit − interest payments. It strips out the cost of servicing past debt, so it shows the *current* year's fiscal stance. A zero primary deficit means the government is borrowing only to pay interest on earlier loans.\nThe FRBM Act, 2003 sets targets for reducing these deficits.",
    expectedMinutes: 3,
    tags: ["economy", "budget"],
  },
];
