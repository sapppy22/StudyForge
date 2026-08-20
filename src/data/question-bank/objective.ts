import type { BankSeed } from "./types";

/**
 * The objective half of the sheet.
 *
 * The bank started as derivations, numericals and written answers — the work
 * you do on paper. That is the half students under-practise, but it is not the
 * half most of these papers are made of: JEE Main is 60 MCQs out of 75, NEET is
 * 180 out of 180, and CAT, CLAT and the GRE are almost entirely multiple
 * choice. A sheet without them trains for the wrong exam.
 *
 * These are written the way the real papers write them: the distractors are the
 * answers you get by making the specific mistake the question is testing for,
 * not filler. Working them with the solution hidden is the point.
 */
export const objectiveBank: BankSeed[] = [
  /* ------------------------------------------------------------ JEE Main */
  {
    slug: "jee-obj-phy-projectile-two-angles",
    examType: "JEE_MAIN",
    subject: "Physics",
    chapter: "Kinematics",
    topic: "Projectile motion",
    type: "mcq",
    difficulty: "easy",
    content:
      "Two projectiles are fired from level ground with the same speed at angles $30^\\circ$ and $60^\\circ$. Which quantity is the same for both?",
    options: [
      { label: "A", text: "Horizontal range" },
      { label: "B", text: "Maximum height" },
      { label: "C", text: "Time of flight" },
      { label: "D", text: "Speed at the highest point" },
    ],
    correctAnswer: "A",
    solution:
      "Range $R = \\frac{u^2 \\sin 2\\theta}{g}$, and $\\sin 60^\\circ = \\sin 120^\\circ$, so complementary angles share a range. Height ($\\propto \\sin^2\\theta$), time of flight ($\\propto \\sin\\theta$) and the horizontal speed at the apex ($u\\cos\\theta$) all differ.",
    hint: "Which of these depends on $\\sin 2\\theta$ rather than $\\sin\\theta$?",
    expectedMinutes: 2,
    tags: ["projectile", "complementary angles"],
  },
  {
    slug: "jee-obj-phy-capacitor-dielectric",
    examType: "JEE_MAIN",
    subject: "Physics",
    chapter: "Electrostatics",
    topic: "Capacitors and dielectrics",
    type: "mcq",
    difficulty: "medium",
    content:
      "A parallel-plate capacitor is charged and then **disconnected** from the battery. A dielectric of constant $K > 1$ is inserted, filling the gap. Which statement is correct?",
    options: [
      { label: "A", text: "The charge stays the same and the potential difference falls by a factor $K$" },
      { label: "B", text: "The potential difference stays the same and the charge rises by a factor $K$" },
      { label: "C", text: "Both the charge and the potential difference stay the same" },
      { label: "D", text: "The stored energy increases by a factor $K$" },
    ],
    correctAnswer: "A",
    solution:
      "Disconnected means isolated, so $Q$ is fixed. $C' = KC$, hence $V' = Q/C' = V/K$. Energy $U' = Q^2/(2C') = U/K$, so the stored energy falls — the dielectric is pulled in, and the field does the work.",
    hint: "Ask first which quantity is held fixed: charge, or voltage?",
    expectedMinutes: 3,
    tags: ["capacitor", "dielectric", "conceptual trap"],
  },
  {
    slug: "jee-obj-phy-photoelectric-stopping-potential",
    examType: "JEE_MAIN",
    subject: "Physics",
    chapter: "Modern Physics",
    topic: "Photoelectric effect",
    type: "mcq",
    difficulty: "medium",
    content:
      "In a photoelectric experiment the intensity of the incident light is doubled while its frequency is unchanged. The stopping potential:",
    options: [
      { label: "A", text: "Remains unchanged" },
      { label: "B", text: "Doubles" },
      { label: "C", text: "Halves" },
      { label: "D", text: "Becomes four times larger" },
    ],
    correctAnswer: "A",
    solution:
      "$eV_0 = h\\nu - \\phi$ depends only on frequency and work function. Intensity sets how many photons arrive, so it changes the saturation current, not the maximum kinetic energy.",
    expectedMinutes: 2,
    tags: ["photoelectric", "conceptual"],
  },
  {
    slug: "jee-obj-chem-hybridisation-xef4",
    examType: "JEE_MAIN",
    subject: "Chemistry",
    chapter: "Chemical Bonding",
    topic: "VSEPR and hybridisation",
    type: "mcq",
    difficulty: "easy",
    content: "The shape and hybridisation of $\\mathrm{XeF_4}$ are:",
    options: [
      { label: "A", text: "Square planar, $sp^3d^2$" },
      { label: "B", text: "Tetrahedral, $sp^3$" },
      { label: "C", text: "See-saw, $sp^3d$" },
      { label: "D", text: "Square pyramidal, $sp^3d^2$" },
    ],
    correctAnswer: "A",
    solution:
      "Xe contributes 8 valence electrons; 4 bond pairs to F leaves 2 lone pairs, so 6 electron domains give $sp^3d^2$ / octahedral geometry. The two lone pairs occupy opposite axial positions, leaving a square planar shape.",
    hint: "Count electron domains first, then subtract the lone pairs to get the shape.",
    expectedMinutes: 2,
    tags: ["vsepr", "noble gas compounds"],
  },
  {
    slug: "jee-obj-chem-order-of-reaction-half-life",
    examType: "JEE_MAIN",
    subject: "Chemistry",
    chapter: "Chemical Kinetics",
    topic: "Order and half-life",
    type: "mcq",
    difficulty: "medium",
    content:
      "For a reaction, the half-life is found to be independent of the initial concentration. The order of the reaction is:",
    options: [
      { label: "A", text: "First" },
      { label: "B", text: "Zero" },
      { label: "C", text: "Second" },
      { label: "D", text: "Half" },
    ],
    correctAnswer: "A",
    solution:
      "For order $n$, $t_{1/2} \\propto [A]_0^{1-n}$. Independence of $[A]_0$ requires $1 - n = 0$, so $n = 1$; only first-order reactions have a constant half-life.",
    expectedMinutes: 2,
    tags: ["kinetics", "half-life"],
  },
  {
    slug: "jee-obj-chem-aromaticity-count",
    examType: "JEE_MAIN",
    subject: "Chemistry",
    chapter: "Organic Chemistry — Basic Principles",
    topic: "Aromaticity",
    type: "mcq",
    difficulty: "medium",
    content:
      "Which species is aromatic: cyclopentadienyl anion, cyclopentadienyl cation, cycloheptatrienyl (tropylium) cation, cyclobutadiene?",
    options: [
      { label: "A", text: "Cyclopentadienyl anion and tropylium cation" },
      { label: "B", text: "Cyclopentadienyl cation and cyclobutadiene" },
      { label: "C", text: "All four" },
      { label: "D", text: "Only cyclobutadiene" },
    ],
    correctAnswer: "A",
    solution:
      "Hückel's rule needs a planar, fully conjugated ring with $4n+2$ π electrons. The cyclopentadienyl anion has 6 and the tropylium cation has 6 — both aromatic. The cyclopentadienyl cation (4) and cyclobutadiene (4) are $4n$, hence antiaromatic.",
    expectedMinutes: 3,
    tags: ["aromaticity", "huckel"],
  },
  {
    slug: "jee-obj-math-quadratic-common-root",
    examType: "JEE_MAIN",
    subject: "Mathematics",
    chapter: "Quadratic Equations",
    topic: "Common roots",
    type: "mcq",
    difficulty: "medium",
    content:
      "If $x^2 + bx + c = 0$ and $x^2 + cx + b = 0$ ($b \\neq c$) have exactly one root in common, then $b + c$ equals:",
    options: [
      { label: "A", text: "$-1$" },
      { label: "B", text: "$0$" },
      { label: "C", text: "$1$" },
      { label: "D", text: "$2$" },
    ],
    correctAnswer: "A",
    solution:
      "Subtracting the equations gives $(b-c)x + (c-b) = 0$, so $x = 1$ since $b \\neq c$. Substituting $x = 1$ into the first: $1 + b + c = 0$, hence $b + c = -1$.",
    hint: "Subtract one equation from the other — the common root satisfies both.",
    expectedMinutes: 3,
    tags: ["quadratic", "common root"],
  },
  {
    slug: "jee-obj-math-definite-integral-symmetry",
    examType: "JEE_MAIN",
    subject: "Mathematics",
    chapter: "Definite Integration",
    topic: "Properties of definite integrals",
    type: "mcq",
    difficulty: "medium",
    content:
      "The value of $\\displaystyle\\int_{0}^{\\pi/2} \\frac{\\sqrt{\\sin x}}{\\sqrt{\\sin x} + \\sqrt{\\cos x}}\\,dx$ is:",
    options: [
      { label: "A", text: "$\\pi/4$" },
      { label: "B", text: "$\\pi/2$" },
      { label: "C", text: "$1$" },
      { label: "D", text: "$\\pi$" },
    ],
    correctAnswer: "A",
    solution:
      "Let $I$ be the integral. Using $\\int_0^a f(x)dx = \\int_0^a f(a-x)dx$ with $a = \\pi/2$ swaps $\\sin$ and $\\cos$, giving a second expression $I'$. Then $I + I' = \\int_0^{\\pi/2} 1\\,dx = \\pi/2$, and by symmetry $I = I'$, so $I = \\pi/4$.",
    hint: "Apply the king's property and add the result to the original.",
    expectedMinutes: 3,
    tags: ["definite integral", "king property"],
  },
  {
    slug: "jee-obj-math-probability-at-least-one",
    examType: "JEE_MAIN",
    subject: "Mathematics",
    chapter: "Probability",
    topic: "Complementary events",
    type: "mcq",
    difficulty: "easy",
    content:
      "Three fair coins are tossed. The probability of getting at least one head is:",
    options: [
      { label: "A", text: "$7/8$" },
      { label: "B", text: "$1/8$" },
      { label: "C", text: "$3/8$" },
      { label: "D", text: "$1/2$" },
    ],
    correctAnswer: "A",
    solution:
      "$P(\\text{at least one head}) = 1 - P(\\text{no heads}) = 1 - (1/2)^3 = 7/8$.",
    expectedMinutes: 1,
    tags: ["probability", "complement"],
  },
  {
    slug: "jee-obj-math-vectors-coplanar",
    examType: "JEE_MAIN",
    subject: "Mathematics",
    chapter: "Vectors and 3D Geometry",
    topic: "Scalar triple product",
    type: "mcq",
    difficulty: "medium",
    content:
      "The vectors $\\vec{a} = \\hat{i} + \\lambda\\hat{j} + 2\\hat{k}$, $\\vec{b} = \\hat{i} + 2\\hat{j} + \\hat{k}$ and $\\vec{c} = 2\\hat{i} - \\hat{j} + \\hat{k}$ are coplanar when $\\lambda$ equals:",
    options: [
      { label: "A", text: "$7$" },
      { label: "B", text: "$-7$" },
      { label: "C", text: "$3$" },
      { label: "D", text: "$10$" },
    ],
    correctAnswer: "A",
    solution:
      "Coplanarity means the scalar triple product vanishes: $\\begin{vmatrix}1 & \\lambda & 2\\\\ 1 & 2 & 1\\\\ 2 & -1 & 1\\end{vmatrix} = 0$. Expanding along the first row: $1(2\\cdot1 - 1\\cdot(-1)) - \\lambda(1\\cdot1 - 1\\cdot2) + 2(1\\cdot(-1) - 2\\cdot2) = 3 + \\lambda - 10 = \\lambda - 7$. Setting this to zero gives $\\lambda = 7$. The sign of the middle cofactor is where this is usually lost.",
    hint: "Set the determinant of the three components to zero.",
    expectedMinutes: 3,
    tags: ["vectors", "coplanarity"],
  },

  /* ---------------------------------------------------------------- NEET */
  {
    slug: "neet-obj-bio-glycolysis-net-atp",
    examType: "NEET",
    subject: "Botany",
    chapter: "Respiration in Plants",
    topic: "Glycolysis",
    type: "mcq",
    difficulty: "easy",
    content: "The net gain of ATP per molecule of glucose during glycolysis is:",
    options: [
      { label: "A", text: "2" },
      { label: "B", text: "4" },
      { label: "C", text: "36" },
      { label: "D", text: "38" },
    ],
    correctAnswer: "A",
    solution:
      "Four ATP are produced by substrate-level phosphorylation but two are consumed in the preparatory phase, giving a net gain of 2 ATP (plus 2 NADH).",
    hint: "Count what is spent as well as what is made.",
    expectedMinutes: 1,
    tags: ["glycolysis", "atp"],
  },
  {
    slug: "neet-obj-bio-mendel-dihybrid-ratio",
    examType: "NEET",
    subject: "Botany",
    chapter: "Principles of Inheritance",
    topic: "Dihybrid cross",
    type: "mcq",
    difficulty: "easy",
    content:
      "In a dihybrid cross between two heterozygotes, the phenotypic ratio in the $F_2$ generation is:",
    options: [
      { label: "A", text: "9 : 3 : 3 : 1" },
      { label: "B", text: "3 : 1" },
      { label: "C", text: "1 : 2 : 1" },
      { label: "D", text: "9 : 7" },
    ],
    correctAnswer: "A",
    solution:
      "Independent assortment of two gene pairs gives $(3:1) \\times (3:1) = 9:3:3:1$. The 9:7 ratio arises only under complementary gene interaction.",
    expectedMinutes: 1,
    tags: ["genetics", "mendel"],
  },
  {
    slug: "neet-obj-bio-heart-pacemaker",
    examType: "NEET",
    subject: "Zoology",
    chapter: "Body Fluids and Circulation",
    topic: "Cardiac conduction",
    type: "mcq",
    difficulty: "easy",
    content: "The pacemaker of the human heart is:",
    options: [
      { label: "A", text: "The sino-atrial node" },
      { label: "B", text: "The atrio-ventricular node" },
      { label: "C", text: "The bundle of His" },
      { label: "D", text: "Purkinje fibres" },
    ],
    correctAnswer: "A",
    solution:
      "The SA node in the right atrium depolarises fastest (~70–75 times a minute) and therefore sets the rhythm. The AV node is the backup pacemaker at a slower intrinsic rate.",
    expectedMinutes: 1,
    tags: ["circulation", "heart"],
  },
  {
    slug: "neet-obj-bio-enzyme-competitive-inhibition",
    examType: "NEET",
    subject: "Zoology",
    chapter: "Biomolecules",
    topic: "Enzyme inhibition",
    type: "mcq",
    difficulty: "medium",
    content:
      "A competitive inhibitor affects enzyme kinetics by:",
    options: [
      { label: "A", text: "Increasing $K_m$ while leaving $V_{max}$ unchanged" },
      { label: "B", text: "Decreasing $V_{max}$ while leaving $K_m$ unchanged" },
      { label: "C", text: "Decreasing both $K_m$ and $V_{max}$" },
      { label: "D", text: "Increasing both $K_m$ and $V_{max}$" },
    ],
    correctAnswer: "A",
    solution:
      "A competitive inhibitor binds the active site and can be outcompeted by more substrate, so $V_{max}$ is still reachable but more substrate is needed to reach half of it — $K_m$ rises. A non-competitive inhibitor is the one that lowers $V_{max}$.",
    expectedMinutes: 2,
    tags: ["enzymes", "kinetics"],
  },
  {
    slug: "neet-obj-phy-lens-power-combination",
    examType: "NEET",
    subject: "Physics",
    chapter: "Ray Optics",
    topic: "Combination of lenses",
    type: "mcq",
    difficulty: "easy",
    content:
      "Two thin lenses of powers $+5\\text{ D}$ and $-3\\text{ D}$ are placed in contact. The focal length of the combination is:",
    options: [
      { label: "A", text: "$+50\\text{ cm}$" },
      { label: "B", text: "$+20\\text{ cm}$" },
      { label: "C", text: "$-50\\text{ cm}$" },
      { label: "D", text: "$+12.5\\text{ cm}$" },
    ],
    correctAnswer: "A",
    solution:
      "Powers add in contact: $P = 5 - 3 = 2\\text{ D}$, so $f = 1/P = 0.5\\text{ m} = +50\\text{ cm}$.",
    expectedMinutes: 1,
    tags: ["optics", "lens power"],
  },
  {
    slug: "neet-obj-chem-ideal-gas-rms-speed",
    examType: "NEET",
    subject: "Chemistry",
    chapter: "States of Matter",
    topic: "Kinetic theory",
    type: "mcq",
    difficulty: "medium",
    content:
      "The root-mean-square speed of an ideal gas is doubled. Its absolute temperature becomes:",
    options: [
      { label: "A", text: "Four times the original" },
      { label: "B", text: "Twice the original" },
      { label: "C", text: "Half the original" },
      { label: "D", text: "Unchanged" },
    ],
    correctAnswer: "A",
    solution:
      "$v_{rms} = \\sqrt{3RT/M} \\propto \\sqrt{T}$, so doubling the speed requires quadrupling the absolute temperature.",
    expectedMinutes: 2,
    tags: ["kinetic theory", "rms speed"],
  },
  {
    slug: "neet-obj-chem-lanthanoid-contraction",
    examType: "NEET",
    subject: "Chemistry",
    chapter: "d- and f-Block Elements",
    topic: "Lanthanoid contraction",
    type: "mcq",
    difficulty: "medium",
    content: "Lanthanoid contraction is chiefly responsible for:",
    options: [
      { label: "A", text: "Zr and Hf having nearly identical atomic radii" },
      { label: "B", text: "The high melting points of transition metals" },
      { label: "C", text: "The colour of transition metal complexes" },
      { label: "D", text: "The paramagnetism of $\\mathrm{Fe^{3+}}$" },
    ],
    correctAnswer: "A",
    solution:
      "Poor shielding by 4f electrons causes a steady size decrease across the lanthanoids, which offsets the expected increase down the group — leaving Zr (second row) and Hf (third row) almost the same size and chemically very alike.",
    expectedMinutes: 2,
    tags: ["lanthanoid contraction", "periodicity"],
  },

  /* ------------------------------------------------------------- SSC CGL */
  {
    slug: "ssc-obj-quant-successive-discount",
    examType: "SSC_CGL",
    subject: "Quantitative Aptitude",
    chapter: "Percentage",
    topic: "Successive discounts",
    type: "mcq",
    difficulty: "easy",
    content:
      "Successive discounts of 20% and 10% are equivalent to a single discount of:",
    options: [
      { label: "A", text: "28%" },
      { label: "B", text: "30%" },
      { label: "C", text: "25%" },
      { label: "D", text: "32%" },
    ],
    correctAnswer: "A",
    solution:
      "Net factor $= 0.8 \\times 0.9 = 0.72$, so the single equivalent discount is $28\\%$. Adding the discounts to get 30% is the mistake this question tests.",
    hint: "Discounts multiply, they do not add.",
    expectedMinutes: 1,
    tags: ["percentage", "discount"],
  },
  {
    slug: "ssc-obj-quant-average-replacement",
    examType: "SSC_CGL",
    subject: "Quantitative Aptitude",
    chapter: "Averages",
    topic: "Change in average",
    type: "mcq",
    difficulty: "medium",
    content:
      "The average weight of 8 people increases by 2.5 kg when a new person replaces one weighing 65 kg. The weight of the new person is:",
    options: [
      { label: "A", text: "85 kg" },
      { label: "B", text: "80 kg" },
      { label: "C", text: "75 kg" },
      { label: "D", text: "90 kg" },
    ],
    correctAnswer: "A",
    solution:
      "Total weight rises by $8 \\times 2.5 = 20$ kg, so the newcomer weighs $65 + 20 = 85$ kg.",
    expectedMinutes: 1,
    tags: ["averages"],
  },
  {
    slug: "ssc-obj-reasoning-blood-relation",
    examType: "SSC_CGL",
    subject: "Reasoning",
    chapter: "Blood Relations",
    type: "mcq",
    difficulty: "medium",
    content:
      "Pointing to a photograph, a man said, \"She is the daughter of the only son of my grandfather.\" How is the woman related to him?",
    options: [
      { label: "A", text: "His sister" },
      { label: "B", text: "His daughter" },
      { label: "C", text: "His cousin" },
      { label: "D", text: "His niece" },
    ],
    correctAnswer: "A",
    solution:
      "The only son of his grandfather is his father, so the woman is his father's daughter — his sister.",
    expectedMinutes: 1,
    tags: ["blood relations"],
  },
  {
    slug: "ssc-obj-english-one-word",
    examType: "SSC_CGL",
    subject: "English",
    chapter: "Vocabulary",
    topic: "One word substitution",
    type: "mcq",
    difficulty: "easy",
    content: "One word for \"a person who knows many languages\":",
    options: [
      { label: "A", text: "Polyglot" },
      { label: "B", text: "Bibliophile" },
      { label: "C", text: "Philologist" },
      { label: "D", text: "Linguist" },
    ],
    correctAnswer: "A",
    solution:
      "A polyglot speaks several languages. A philologist studies the history of language, a bibliophile loves books, and 'linguist' is the broader academic term — 'polyglot' is the precise substitution.",
    expectedMinutes: 1,
    tags: ["vocabulary"],
  },
  {
    slug: "ssc-obj-gk-fundamental-duties",
    examType: "SSC_CGL",
    subject: "General Awareness",
    chapter: "Indian Polity",
    topic: "Constitution",
    type: "mcq",
    difficulty: "medium",
    content: "Fundamental Duties were added to the Indian Constitution by which amendment?",
    options: [
      { label: "A", text: "42nd Amendment, 1976" },
      { label: "B", text: "44th Amendment, 1978" },
      { label: "C", text: "73rd Amendment, 1992" },
      { label: "D", text: "1st Amendment, 1951" },
    ],
    correctAnswer: "A",
    solution:
      "The 42nd Amendment inserted Part IVA (Article 51A) on the recommendation of the Swaran Singh Committee. The 44th reversed several other 42nd Amendment changes but not this one.",
    expectedMinutes: 1,
    tags: ["polity", "amendments"],
  },

  /* ----------------------------------------------------------------- CAT */
  {
    slug: "cat-obj-qa-work-efficiency",
    examType: "CAT",
    subject: "Quantitative Aptitude",
    chapter: "Time and Work",
    type: "mcq",
    difficulty: "medium",
    content:
      "A alone finishes a job in 12 days and B alone in 18 days. They work together for 4 days, after which A leaves. B finishes the rest alone. The total time taken is:",
    options: [
      { label: "A", text: "12 days" },
      { label: "B", text: "10 days" },
      { label: "C", text: "8 days" },
      { label: "D", text: "14 days" },
    ],
    correctAnswer: "A",
    solution:
      "Combined rate $= \\frac{1}{12} + \\frac{1}{18} = \\frac{5}{36}$ per day, so four days together completes $\\frac{20}{36} = \\frac{5}{9}$. The remaining $\\frac{4}{9}$ takes B $\\frac{4}{9} \\times 18 = 8$ days. Total elapsed time $= 4 + 8 = 12$ days. Answering 8 means reading the question as \"days after A leaves\" — it asks for the total.",
    hint: "Add the rates, not the times.",
    expectedMinutes: 3,
    tags: ["time and work"],
  },
  {
    slug: "cat-obj-varc-para-summary",
    examType: "CAT",
    subject: "Verbal Ability & Reading Comprehension",
    chapter: "Para Summary",
    type: "mcq",
    difficulty: "medium",
    content:
      "\"Historians once treated famine as a failure of harvests. Recent work argues the decisive variable is instead entitlement — who can command food when it is scarce — since famines have occurred in years of adequate aggregate supply.\" The best summary is:",
    options: [
      { label: "A", text: "Famine is better explained by access to food than by its total availability." },
      { label: "B", text: "Harvest failure has no role in causing famine." },
      { label: "C", text: "Historians have generally been wrong about the causes of famine." },
      { label: "D", text: "Food supply is usually adequate during famines." },
    ],
    correctAnswer: "A",
    solution:
      "The passage shifts emphasis from supply to entitlement without denying supply matters. B and C overstate; D generalises a supporting observation into the main claim. A carries the shift and nothing more.",
    hint: "The right summary matches the strength of the claim, not just its topic.",
    expectedMinutes: 2,
    tags: ["para summary", "scope"],
  },
  {
    slug: "cat-obj-dilr-venn-three-sets",
    examType: "CAT",
    subject: "Data Interpretation & Logical Reasoning",
    chapter: "Venn Diagrams",
    type: "mcq",
    difficulty: "medium",
    content:
      "In a group of 100 people, 60 read A, 45 read B and 30 read both. How many read neither?",
    options: [
      { label: "A", text: "25" },
      { label: "B", text: "15" },
      { label: "C", text: "35" },
      { label: "D", text: "20" },
    ],
    correctAnswer: "A",
    solution:
      "$|A \\cup B| = 60 + 45 - 30 = 75$, so $100 - 75 = 25$ read neither.",
    expectedMinutes: 2,
    tags: ["venn", "set theory"],
  },

  /* ---------------------------------------------------------------- CLAT */
  {
    slug: "clat-obj-legal-negligence-principle",
    examType: "CLAT",
    subject: "Legal Reasoning",
    chapter: "Law of Torts",
    topic: "Negligence",
    type: "mcq",
    difficulty: "medium",
    content:
      "Principle: A person is liable in negligence if they owed a duty of care, breached it, and that breach caused the damage. Facts: A shopkeeper mops the floor and puts up a clearly visible warning sign. A customer, running while looking at his phone, slips and is injured. Is the shopkeeper liable?",
    options: [
      { label: "A", text: "No, because the duty of care was discharged by the warning" },
      { label: "B", text: "Yes, because the floor was wet" },
      { label: "C", text: "Yes, because the customer was on his premises" },
      { label: "D", text: "No, because shopkeepers owe customers no duty of care" },
    ],
    correctAnswer: "A",
    solution:
      "The duty existed, but the visible warning discharges it — there is no breach, so the chain fails at the second element. D misstates the principle: the duty plainly exists.",
    hint: "Apply each element of the principle in turn and stop at the first that fails.",
    expectedMinutes: 2,
    tags: ["negligence", "principle-fact"],
  },
  {
    slug: "clat-obj-logical-assumption",
    examType: "CLAT",
    subject: "Logical Reasoning",
    chapter: "Assumptions",
    type: "mcq",
    difficulty: "medium",
    content:
      "\"The city should widen its main road, because traffic jams there have worsened every year.\" The argument assumes that:",
    options: [
      { label: "A", text: "Widening the road will ease the congestion" },
      { label: "B", text: "The city has the money to widen the road" },
      { label: "C", text: "Traffic will continue to worsen" },
      { label: "D", text: "No other road in the city is congested" },
    ],
    correctAnswer: "A",
    solution:
      "The conclusion recommends widening as the remedy, which only follows if widening actually remedies the problem. Feasibility (B) and the state of other roads (D) are separate questions; C restates the evidence rather than bridging it to the conclusion.",
    expectedMinutes: 2,
    tags: ["assumption", "critical reasoning"],
  },
  {
    slug: "clat-obj-english-inference",
    examType: "CLAT",
    subject: "English",
    chapter: "Reading Comprehension",
    type: "mcq",
    difficulty: "easy",
    content:
      "\"The treaty was signed with considerable fanfare, though few of its signatories had any intention of ratifying it.\" It can be inferred that:",
    options: [
      { label: "A", text: "The ceremony was more significant than the treaty's likely effect" },
      { label: "B", text: "The treaty was never signed" },
      { label: "C", text: "Ratification is not required for a treaty to bind" },
      { label: "D", text: "The signatories opposed the treaty's aims" },
    ],
    correctAnswer: "A",
    solution:
      "The contrast between 'fanfare' and the absence of intent to ratify supports exactly one inference: the display outweighed the substance. D goes further than the text — one may support the aims and still not ratify.",
    expectedMinutes: 2,
    tags: ["inference", "tone"],
  },

  /* ----------------------------------------------------------------- GRE */
  {
    slug: "gre-obj-verbal-text-completion",
    examType: "GRE",
    subject: "Verbal Reasoning",
    chapter: "Text Completion",
    type: "mcq",
    difficulty: "medium",
    content:
      "Although the committee's report was ostensibly ______, its careful omissions revealed a clear preference. Choose the word that best completes the sentence.",
    options: [
      { label: "A", text: "impartial" },
      { label: "B", text: "exhaustive" },
      { label: "C", text: "contentious" },
      { label: "D", text: "premature" },
    ],
    correctAnswer: "A",
    solution:
      "'Although … ostensibly X, its omissions revealed a preference' sets up a contrast with having a preference, so the blank must mean 'without preference'. 'Exhaustive' contrasts with omission but not with preference, which is what the second clause actually establishes.",
    hint: "Find the word in the second clause the blank has to contrast with.",
    expectedMinutes: 2,
    tags: ["text completion", "contrast"],
  },
  {
    slug: "gre-obj-quant-comparison-inequality",
    examType: "GRE",
    subject: "Quantitative Reasoning",
    chapter: "Quantitative Comparison",
    type: "mcq",
    difficulty: "medium",
    content:
      "Given $-1 < x < 0$, compare Quantity A: $x^2$ with Quantity B: $x^3$.",
    options: [
      { label: "A", text: "Quantity A is greater" },
      { label: "B", text: "Quantity B is greater" },
      { label: "C", text: "The two quantities are equal" },
      { label: "D", text: "The relationship cannot be determined" },
    ],
    correctAnswer: "A",
    solution:
      "For a negative fraction, $x^2$ is positive and $x^3$ is negative, so A > B throughout the interval. The habit of testing only $x > 0$ is what makes this question work.",
    hint: "Test a value inside the stated interval, not outside it.",
    expectedMinutes: 2,
    tags: ["quantitative comparison", "number properties"],
  },
  {
    slug: "gre-obj-quant-percent-change",
    examType: "GRE",
    subject: "Quantitative Reasoning",
    chapter: "Percentages",
    type: "mcq",
    difficulty: "easy",
    content:
      "A price rises by 25% and then falls by 20%. The net change from the original price is:",
    options: [
      { label: "A", text: "No change" },
      { label: "B", text: "A 5% increase" },
      { label: "C", text: "A 5% decrease" },
      { label: "D", text: "A 45% increase" },
    ],
    correctAnswer: "A",
    solution:
      "$1.25 \\times 0.80 = 1.00$, so the price returns exactly to where it started. The percentages are taken on different bases, which is why they cancel.",
    expectedMinutes: 1,
    tags: ["percentage", "successive change"],
  },
];
