import { ExamType } from "@prisma/client";

/**
 * Syllabus trees for every exam in the catalog.
 *
 * A goal is only useful once it has topics — proficiency, the study plan and
 * question generation all hang off leaf topics — so every exam ships one rather
 * than leaving new goals empty. Depth is subject → chapter → topic, and the
 * leaves are deliberately sized to a single study block rather than a whole
 * chapter.
 *
 * JEE Main and Class 9 keep their existing JSON templates; everything else
 * lives here so adding an exam is one edit rather than a new file.
 */

export interface ChapterSyllabus {
  title: string;
  topics: string[];
}

export interface SubjectSyllabus {
  title: string;
  chapters: ChapterSyllabus[];
}

export interface ExamSyllabus {
  examType: string;
  title: string;
  subjects: SubjectSyllabus[];
}

/* -------------------------------------------------------------------------- */
/*  Shared building blocks                                                     */
/* -------------------------------------------------------------------------- */

const REASONING: SubjectSyllabus = {
  title: "Reasoning",
  chapters: [
    {
      title: "Verbal Reasoning",
      topics: ["Analogies", "Classification", "Coding-Decoding", "Blood Relations", "Direction Sense", "Syllogisms", "Statement and Assumption"],
    },
    {
      title: "Non-Verbal & Analytical Reasoning",
      topics: ["Series Completion", "Mirror and Water Images", "Paper Folding and Cutting", "Cubes and Dice", "Seating Arrangement", "Puzzles", "Data Sufficiency"],
    },
  ],
};

const QUANT_ARITHMETIC: SubjectSyllabus = {
  title: "Quantitative Aptitude",
  chapters: [
    {
      title: "Arithmetic",
      topics: ["Percentages", "Ratio and Proportion", "Averages", "Profit and Loss", "Simple and Compound Interest", "Time, Speed and Distance", "Time and Work", "Mixtures and Alligation"],
    },
    {
      title: "Algebra and Geometry",
      topics: ["Linear and Quadratic Equations", "Sequences and Series", "Mensuration", "Triangles and Circles", "Coordinate Geometry", "Trigonometry"],
    },
    {
      title: "Modern Maths and Data",
      topics: ["Permutations and Combinations", "Probability", "Number System", "Data Interpretation — Tables", "Data Interpretation — Graphs", "Caselets"],
    },
  ],
};

const ENGLISH_LANGUAGE: SubjectSyllabus = {
  title: "English",
  chapters: [
    {
      title: "Grammar and Usage",
      topics: ["Parts of Speech", "Subject-Verb Agreement", "Tenses", "Error Detection", "Sentence Improvement", "Active and Passive Voice", "Direct and Indirect Speech"],
    },
    {
      title: "Vocabulary",
      topics: ["Synonyms and Antonyms", "Idioms and Phrases", "One Word Substitution", "Spelling and Commonly Confused Words", "Cloze Test"],
    },
    {
      title: "Comprehension",
      topics: ["Reading Comprehension", "Para Jumbles", "Sentence Completion", "Critical Reasoning"],
    },
  ],
};

const GENERAL_AWARENESS: SubjectSyllabus = {
  title: "General Awareness",
  chapters: [
    {
      title: "Indian History and Culture",
      topics: ["Ancient India", "Medieval India", "Modern India and the Freedom Struggle", "Art, Culture and Heritage"],
    },
    {
      title: "Polity and Economy",
      topics: ["Constitution and Its Features", "Parliament and State Legislatures", "Judiciary", "Fundamental Rights and Duties", "Indian Economy Basics", "Banking and Budget"],
    },
    {
      title: "Geography and Science",
      topics: ["Physical Geography of India", "World Geography", "General Science — Physics", "General Science — Chemistry", "General Science — Biology", "Environment and Ecology"],
    },
    {
      title: "Current Affairs",
      topics: ["National Events", "International Relations", "Awards and Honours", "Sports", "Science and Technology in the News"],
    },
  ],
};

const NCERT_PHYSICS: SubjectSyllabus = {
  title: "Physics",
  chapters: [
    {
      title: "Mechanics",
      topics: ["Units and Measurements", "Kinematics", "Laws of Motion", "Work, Energy and Power", "Rotational Motion", "Gravitation", "Properties of Matter"],
    },
    {
      title: "Thermal Physics and Waves",
      topics: ["Thermal Properties of Matter", "Thermodynamics", "Kinetic Theory of Gases", "Oscillations", "Waves and Sound"],
    },
    {
      title: "Electromagnetism",
      topics: ["Electrostatics", "Current Electricity", "Magnetic Effects of Current", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves"],
    },
    {
      title: "Optics and Modern Physics",
      topics: ["Ray Optics", "Wave Optics", "Dual Nature of Radiation", "Atoms and Nuclei", "Semiconductor Electronics"],
    },
  ],
};

const NCERT_CHEMISTRY: SubjectSyllabus = {
  title: "Chemistry",
  chapters: [
    {
      title: "Physical Chemistry",
      topics: ["Some Basic Concepts", "Structure of Atom", "Chemical Bonding", "States of Matter", "Thermodynamics", "Equilibrium", "Redox Reactions", "Solutions", "Electrochemistry", "Chemical Kinetics"],
    },
    {
      title: "Inorganic Chemistry",
      topics: ["Periodic Table and Periodicity", "s-Block Elements", "p-Block Elements", "d- and f-Block Elements", "Coordination Compounds", "Metallurgy"],
    },
    {
      title: "Organic Chemistry",
      topics: ["Basic Principles and Techniques", "Hydrocarbons", "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers", "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules and Polymers"],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Per-exam syllabi                                                           */
/* -------------------------------------------------------------------------- */

const syllabi: Partial<Record<ExamType, ExamSyllabus>> = {
  [ExamType.JEE_ADVANCED]: {
    examType: ExamType.JEE_ADVANCED,
    title: "JEE Advanced",
    subjects: [
      NCERT_PHYSICS,
      NCERT_CHEMISTRY,
      {
        title: "Mathematics",
        chapters: [
          { title: "Algebra", topics: ["Complex Numbers", "Quadratic Equations", "Sequences and Series", "Permutations and Combinations", "Binomial Theorem", "Matrices and Determinants", "Probability"] },
          { title: "Calculus", topics: ["Functions and Limits", "Continuity and Differentiability", "Applications of Derivatives", "Indefinite Integration", "Definite Integration", "Area Under Curves", "Differential Equations"] },
          { title: "Coordinate Geometry and Vectors", topics: ["Straight Lines", "Circles", "Parabola", "Ellipse and Hyperbola", "Vectors", "Three Dimensional Geometry"] },
        ],
      },
    ],
  },

  [ExamType.BITSAT]: {
    examType: ExamType.BITSAT,
    title: "BITSAT",
    subjects: [
      NCERT_PHYSICS,
      NCERT_CHEMISTRY,
      {
        title: "Mathematics",
        chapters: [
          { title: "Algebra and Trigonometry", topics: ["Complex Numbers", "Quadratic Equations", "Sequences and Series", "Binomial Theorem", "Trigonometric Ratios and Identities", "Inverse Trigonometric Functions"] },
          { title: "Calculus", topics: ["Limits and Continuity", "Differentiation", "Applications of Derivatives", "Integration", "Differential Equations"] },
          { title: "Coordinate Geometry and Statistics", topics: ["Straight Lines and Circles", "Conic Sections", "Three Dimensional Geometry", "Statistics", "Linear Programming"] },
        ],
      },
      {
        title: "English Proficiency",
        chapters: [
          { title: "English Proficiency", topics: ["Grammar", "Vocabulary", "Reading Comprehension", "Composition and Rearrangement"] },
        ],
      },
      {
        title: "Logical Reasoning",
        chapters: [
          { title: "Logical Reasoning", topics: ["Verbal Reasoning", "Figure Completion", "Figure Matrix", "Analogy Tests", "Series Tests"] },
        ],
      },
    ],
  },

  [ExamType.GATE]: {
    examType: ExamType.GATE,
    title: "GATE",
    subjects: [
      {
        title: "General Aptitude",
        chapters: [
          { title: "Verbal Aptitude", topics: ["Grammar and Word Usage", "Reading Comprehension", "Narrative Sequencing", "Analytical Reasoning"] },
          { title: "Quantitative Aptitude", topics: ["Ratios and Percentages", "Mensuration and Geometry", "Elementary Statistics and Probability", "Data Interpretation", "Numerical Estimation"] },
        ],
      },
      {
        title: "Engineering Mathematics",
        chapters: [
          { title: "Engineering Mathematics", topics: ["Linear Algebra", "Calculus", "Differential Equations", "Complex Variables", "Probability and Statistics", "Numerical Methods"] },
        ],
      },
      {
        title: "Core Subject",
        chapters: [
          { title: "Core Discipline — Fundamentals", topics: ["Core Concept Block 1", "Core Concept Block 2", "Core Concept Block 3", "Core Concept Block 4"] },
          { title: "Core Discipline — Applications", topics: ["Applied Block 1", "Applied Block 2", "Applied Block 3", "Design and Analysis Problems"] },
        ],
      },
    ],
  },

  [ExamType.NEET]: {
    examType: ExamType.NEET,
    title: "NEET (UG)",
    subjects: [
      NCERT_PHYSICS,
      NCERT_CHEMISTRY,
      {
        title: "Botany",
        chapters: [
          { title: "Diversity and Structure", topics: ["The Living World", "Biological Classification", "Plant Kingdom", "Morphology of Flowering Plants", "Anatomy of Flowering Plants"] },
          { title: "Plant Physiology", topics: ["Photosynthesis", "Respiration in Plants", "Plant Growth and Development", "Transport in Plants", "Mineral Nutrition"] },
          { title: "Genetics and Ecology", topics: ["Cell Cycle and Cell Division", "Principles of Inheritance", "Molecular Basis of Inheritance", "Organisms and Populations", "Ecosystem", "Biodiversity and Conservation"] },
        ],
      },
      {
        title: "Zoology",
        chapters: [
          { title: "Animal Diversity and Structure", topics: ["Animal Kingdom", "Structural Organisation in Animals", "Biomolecules", "Cell — The Unit of Life"] },
          { title: "Human Physiology", topics: ["Digestion and Absorption", "Breathing and Exchange of Gases", "Body Fluids and Circulation", "Excretory Products", "Locomotion and Movement", "Neural Control", "Chemical Coordination"] },
          { title: "Reproduction, Evolution and Biotechnology", topics: ["Human Reproduction", "Reproductive Health", "Evolution", "Human Health and Disease", "Biotechnology — Principles", "Biotechnology — Applications"] },
        ],
      },
    ],
  },

  [ExamType.CAT]: {
    examType: ExamType.CAT,
    title: "CAT",
    subjects: [
      {
        title: "Verbal Ability & Reading Comprehension",
        chapters: [
          { title: "Reading Comprehension", topics: ["Inference Questions", "Main Idea and Tone", "Long Abstract Passages", "Speed Reading Drills"] },
          { title: "Verbal Ability", topics: ["Para Jumbles", "Para Summary", "Odd Sentence Out", "Critical Reasoning"] },
        ],
      },
      {
        title: "Data Interpretation & Logical Reasoning",
        chapters: [
          { title: "Data Interpretation", topics: ["Tables and Bar Graphs", "Line and Pie Charts", "Caselets", "Data Sufficiency", "Mixed Graph Sets"] },
          { title: "Logical Reasoning", topics: ["Arrangements and Distributions", "Games and Tournaments", "Venn Diagrams", "Binary Logic", "Network and Routes"] },
        ],
      },
      QUANT_ARITHMETIC,
    ],
  },

  [ExamType.GMAT]: {
    examType: ExamType.GMAT,
    title: "GMAT Focus Edition",
    subjects: [
      {
        title: "Quantitative Reasoning",
        chapters: [
          { title: "Arithmetic", topics: ["Number Properties", "Fractions, Decimals and Percents", "Ratios and Rates", "Statistics — Mean, Median, Range", "Probability and Combinatorics"] },
          { title: "Algebra", topics: ["Linear Equations", "Quadratics", "Inequalities and Absolute Value", "Functions and Sequences", "Word Problems"] },
        ],
      },
      {
        title: "Verbal Reasoning",
        chapters: [
          { title: "Reading Comprehension", topics: ["Main Idea Questions", "Detail and Inference", "Passage Structure", "Business and Science Passages"] },
          { title: "Critical Reasoning", topics: ["Strengthen and Weaken", "Assumption", "Evaluate the Argument", "Boldface and Structure", "Paradox"] },
        ],
      },
      {
        title: "Data Insights",
        chapters: [
          { title: "Data Insights", topics: ["Data Sufficiency", "Multi-Source Reasoning", "Table Analysis", "Graphics Interpretation", "Two-Part Analysis"] },
        ],
      },
    ],
  },

  [ExamType.GRE]: {
    examType: ExamType.GRE,
    title: "GRE General Test",
    subjects: [
      {
        title: "Verbal Reasoning",
        chapters: [
          { title: "Vocabulary in Context", topics: ["Text Completion — One Blank", "Text Completion — Two and Three Blanks", "Sentence Equivalence", "High-Frequency Word Lists"] },
          { title: "Reading Comprehension", topics: ["Short Passages", "Long Passages", "Paragraph Argument", "Inference and Assumption"] },
        ],
      },
      {
        title: "Quantitative Reasoning",
        chapters: [
          { title: "Arithmetic and Algebra", topics: ["Number Properties", "Percentages and Ratios", "Linear and Quadratic Equations", "Inequalities", "Exponents and Roots"] },
          { title: "Geometry and Data Analysis", topics: ["Lines, Angles and Triangles", "Circles and Polygons", "Coordinate Geometry", "Statistics and Distributions", "Probability", "Data Interpretation Sets"] },
          { title: "Question Formats", topics: ["Quantitative Comparison Strategy", "Numeric Entry Accuracy", "Multiple-Answer Questions"] },
        ],
      },
      {
        title: "Analytical Writing",
        chapters: [
          { title: "Analyze an Issue", topics: ["Essay Structure and Templates", "Building Evidence and Examples", "Common Prompt Themes", "Timed Writing Practice"] },
        ],
      },
    ],
  },

  [ExamType.IELTS]: {
    examType: ExamType.IELTS,
    title: "IELTS Academic",
    subjects: [
      {
        title: "Listening",
        chapters: [
          { title: "Listening Skills", topics: ["Form and Note Completion", "Multiple Choice", "Matching and Labelling", "Map and Plan Labelling", "Accents and Distractors"] },
        ],
      },
      {
        title: "Reading",
        chapters: [
          { title: "Reading Skills", topics: ["Skimming and Scanning", "True / False / Not Given", "Matching Headings", "Sentence and Summary Completion", "Time Management Across Three Passages"] },
        ],
      },
      {
        title: "Writing",
        chapters: [
          { title: "Task 1 — Report", topics: ["Line Graphs and Bar Charts", "Pie Charts and Tables", "Process Diagrams", "Maps", "Comparison Language"] },
          { title: "Task 2 — Essay", topics: ["Opinion Essays", "Discussion Essays", "Problem and Solution", "Cohesion and Linking", "Band 7+ Vocabulary"] },
        ],
      },
      {
        title: "Speaking",
        chapters: [
          { title: "Speaking Parts", topics: ["Part 1 — Introduction", "Part 2 — Cue Card", "Part 3 — Discussion", "Fluency and Pronunciation Drills"] },
        ],
      },
    ],
  },

  [ExamType.TOEFL]: {
    examType: ExamType.TOEFL,
    title: "TOEFL iBT",
    subjects: [
      {
        title: "Reading",
        chapters: [
          { title: "Reading Skills", topics: ["Factual and Negative Factual", "Vocabulary in Context", "Inference and Rhetorical Purpose", "Sentence Insertion", "Prose Summary"] },
        ],
      },
      {
        title: "Listening",
        chapters: [
          { title: "Listening Skills", topics: ["Academic Lectures", "Campus Conversations", "Note-Taking Systems", "Attitude and Function Questions", "Connecting Content"] },
        ],
      },
      {
        title: "Speaking",
        chapters: [
          { title: "Speaking Tasks", topics: ["Independent Task", "Read-Listen-Speak", "Listen-Speak Campus", "Academic Summary Task", "Delivery and Timing"] },
        ],
      },
      {
        title: "Writing",
        chapters: [
          { title: "Writing Tasks", topics: ["Integrated Writing", "Writing for an Academic Discussion", "Paraphrasing", "Grammar Accuracy Under Time"] },
        ],
      },
    ],
  },

  [ExamType.UPSC]: {
    examType: ExamType.UPSC,
    title: "UPSC Civil Services Prelims",
    subjects: [
      {
        title: "History and Culture",
        chapters: [
          { title: "Ancient and Medieval India", topics: ["Indus Valley Civilisation", "Vedic Period", "Mauryan and Gupta Empires", "Delhi Sultanate", "Mughal Empire", "Art and Architecture"] },
          { title: "Modern India", topics: ["Advent of Europeans", "Revolt of 1857", "Socio-Religious Reform Movements", "Indian National Movement", "Post-Independence Consolidation"] },
        ],
      },
      {
        title: "Polity and Governance",
        chapters: [
          { title: "Indian Constitution", topics: ["Making of the Constitution", "Preamble and Basic Structure", "Fundamental Rights", "Directive Principles", "Amendments"] },
          { title: "Institutions", topics: ["Parliament", "Executive and President", "Judiciary", "Federalism and Centre-State Relations", "Constitutional Bodies", "Local Government"] },
        ],
      },
      {
        title: "Geography",
        chapters: [
          { title: "Physical and Indian Geography", topics: ["Geomorphology", "Climatology", "Oceanography", "Indian Physiography", "Indian Climate and Monsoon", "Rivers and Drainage"] },
          { title: "Economic and World Geography", topics: ["Resources and Minerals", "Agriculture", "Industrial Location", "World Physical Features", "Mapping Practice"] },
        ],
      },
      {
        title: "Economy",
        chapters: [
          { title: "Indian Economy", topics: ["National Income", "Money and Banking", "Inflation", "Fiscal Policy and Budget", "External Sector", "Planning and NITI Aayog", "Agriculture and Industry Policy"] },
        ],
      },
      {
        title: "Environment and Science",
        chapters: [
          { title: "Environment and Ecology", topics: ["Ecosystems", "Biodiversity and Conservation", "Climate Change and Conventions", "Pollution", "Protected Areas of India"] },
          { title: "Science and Technology", topics: ["Space Technology", "Biotechnology", "Defence Technology", "IT and Computers", "Recent Developments"] },
        ],
      },
      {
        title: "Current Affairs",
        chapters: [
          { title: "Current Affairs", topics: ["Government Schemes", "International Organisations", "Reports and Indices", "Bilateral Relations", "Monthly Compilation Review"] },
        ],
      },
    ],
  },

  [ExamType.SSC_CGL]: {
    examType: ExamType.SSC_CGL,
    title: "SSC CGL Tier-1",
    subjects: [REASONING, GENERAL_AWARENESS, QUANT_ARITHMETIC, ENGLISH_LANGUAGE],
  },

  [ExamType.SSC_CHSL]: {
    examType: ExamType.SSC_CHSL,
    title: "SSC CHSL Tier-1",
    subjects: [REASONING, GENERAL_AWARENESS, QUANT_ARITHMETIC, ENGLISH_LANGUAGE],
  },

  [ExamType.IBPS_PO]: {
    examType: ExamType.IBPS_PO,
    title: "IBPS PO Prelims",
    subjects: [
      ENGLISH_LANGUAGE,
      {
        title: "Quantitative Aptitude",
        chapters: [
          { title: "Data Interpretation", topics: ["Tabular DI", "Line and Bar DI", "Caselet DI", "Missing DI", "Arithmetic DI"] },
          { title: "Arithmetic", topics: ["Percentages and Averages", "Profit, Loss and Discount", "Time, Speed and Distance", "Time and Work", "Simple and Compound Interest", "Partnership and Mixtures"] },
          { title: "Number Series and Equations", topics: ["Wrong Number Series", "Missing Number Series", "Quadratic Comparison", "Approximation and Simplification"] },
        ],
      },
      {
        title: "Reasoning Ability",
        chapters: [
          { title: "Puzzles and Arrangements", topics: ["Linear Seating", "Circular Seating", "Floor and Box Puzzles", "Scheduling Puzzles", "Categorised Puzzles"] },
          { title: "Miscellaneous Reasoning", topics: ["Syllogism", "Inequality", "Blood Relations", "Direction Sense", "Order and Ranking", "Alphanumeric Series", "Data Sufficiency"] },
        ],
      },
    ],
  },

  [ExamType.RRB_NTPC]: {
    examType: ExamType.RRB_NTPC,
    title: "RRB NTPC CBT-1",
    subjects: [GENERAL_AWARENESS, QUANT_ARITHMETIC, REASONING],
  },

  [ExamType.NDA]: {
    examType: ExamType.NDA,
    title: "NDA & NA",
    subjects: [
      {
        title: "Mathematics",
        chapters: [
          { title: "Algebra", topics: ["Sets and Relations", "Complex Numbers", "Quadratic Equations", "Binomial Theorem", "Matrices and Determinants", "Permutations and Combinations", "Logarithms"] },
          { title: "Trigonometry and Geometry", topics: ["Trigonometric Ratios and Identities", "Heights and Distances", "Inverse Trigonometry", "Analytical Geometry 2D", "Analytical Geometry 3D", "Vectors"] },
          { title: "Calculus and Statistics", topics: ["Limits and Continuity", "Differentiation and Applications", "Integration and Applications", "Differential Equations", "Statistics", "Probability"] },
        ],
      },
      ENGLISH_LANGUAGE,
      {
        title: "General Knowledge",
        chapters: [
          { title: "Science", topics: ["Physics — Mechanics and Heat", "Physics — Electricity and Magnetism", "Chemistry — Basics and Reactions", "General Science and Biology"] },
          { title: "Humanities", topics: ["Indian History", "Geography of India and the World", "Indian Polity", "Economy Basics", "Current Events and Defence Affairs"] },
        ],
      },
    ],
  },

  [ExamType.CLAT]: {
    examType: ExamType.CLAT,
    title: "CLAT (UG)",
    subjects: [
      {
        title: "English Language",
        chapters: [
          { title: "Comprehension", topics: ["Inference and Conclusion", "Author's Tone and Viewpoint", "Vocabulary in Context", "Summary Questions"] },
        ],
      },
      {
        title: "Current Affairs & General Knowledge",
        chapters: [
          { title: "Static and Current", topics: ["National Affairs", "International Affairs", "Arts and Culture", "Historical Events of Continuing Significance", "Legal News"] },
        ],
      },
      {
        title: "Legal Reasoning",
        chapters: [
          { title: "Legal Principles", topics: ["Law of Torts", "Law of Contracts", "Criminal Law Basics", "Constitutional Law Basics", "Principle-Fact Application", "Family and Property Law Basics"] },
        ],
      },
      {
        title: "Logical Reasoning",
        chapters: [
          { title: "Critical and Analytical", topics: ["Argument Identification", "Assumptions and Conclusions", "Strengthen and Weaken", "Analogies and Relationships", "Sequencing and Arrangements"] },
        ],
      },
      {
        title: "Quantitative Techniques",
        chapters: [
          { title: "Elementary Mathematics", topics: ["Ratio and Proportion", "Percentages", "Averages", "Mensuration Basics", "Data Interpretation from Passages"] },
        ],
      },
    ],
  },

  [ExamType.CTET]: {
    examType: ExamType.CTET,
    title: "CTET Paper II",
    subjects: [
      {
        title: "Child Development & Pedagogy",
        chapters: [
          { title: "Child Development", topics: ["Concepts of Development", "Piaget, Kohlberg and Vygotsky", "Socialisation Processes", "Individual Differences", "Assessment for Learning"] },
          { title: "Inclusive Education and Pedagogy", topics: ["Children with Special Needs", "Addressing Learners from Diverse Backgrounds", "Learning and Motivation", "Thinking and Problem Solving"] },
        ],
      },
      {
        title: "Language I",
        chapters: [
          { title: "Language Comprehension", topics: ["Unseen Prose Passage", "Unseen Poem", "Grammar", "Vocabulary"] },
          { title: "Pedagogy of Language", topics: ["Learning and Acquisition", "Principles of Language Teaching", "Language Skills", "Evaluating Language Comprehension", "Teaching-Learning Materials"] },
        ],
      },
      {
        title: "Language II",
        chapters: [
          { title: "Language Comprehension", topics: ["Unseen Prose Passage", "Discourse Passage", "Grammar", "Vocabulary"] },
          { title: "Pedagogy of Language", topics: ["Role of Grammar", "Challenges of Teaching in a Diverse Classroom", "Remedial Teaching", "Assessment Techniques"] },
        ],
      },
      {
        title: "Mathematics & Science",
        chapters: [
          { title: "Mathematics Content", topics: ["Number System", "Algebra", "Geometry and Mensuration", "Data Handling", "Ratio and Proportion"] },
          { title: "Science Content", topics: ["Food and Materials", "The World of the Living", "Moving Things and Machines", "Natural Phenomena and Resources"] },
          { title: "Pedagogical Issues", topics: ["Nature of Mathematics and Science", "Approaches to Teaching", "Remedial Teaching", "Evaluation and Assessment"] },
        ],
      },
    ],
  },

  [ExamType.CUET_UG]: {
    examType: ExamType.CUET_UG,
    title: "CUET (UG)",
    subjects: [
      {
        title: "Language",
        chapters: [
          { title: "Reading and Comprehension", topics: ["Factual Passages", "Narrative Passages", "Literary Passages", "Vocabulary", "Verbal Ability"] },
        ],
      },
      {
        title: "Domain Subject",
        chapters: [
          { title: "Class 12 Domain Syllabus", topics: ["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5", "Unit 6"] },
        ],
      },
      {
        title: "General Test",
        chapters: [
          { title: "General Test", topics: ["General Knowledge and Current Affairs", "General Mental Ability", "Numerical Ability", "Quantitative Reasoning", "Logical and Analytical Reasoning"] },
        ],
      },
    ],
  },

  [ExamType.CLASS_10]: {
    examType: ExamType.CLASS_10,
    title: "CBSE Class 10",
    subjects: [
      {
        title: "Science",
        chapters: [
          { title: "Chemistry", topics: ["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals", "Carbon and its Compounds"] },
          { title: "Biology", topics: ["Life Processes", "Control and Coordination", "How do Organisms Reproduce", "Heredity", "Our Environment"] },
          { title: "Physics", topics: ["Light — Reflection and Refraction", "The Human Eye", "Electricity", "Magnetic Effects of Electric Current"] },
        ],
      },
      {
        title: "Mathematics",
        chapters: [
          { title: "Algebra", topics: ["Real Numbers", "Polynomials", "Pair of Linear Equations", "Quadratic Equations", "Arithmetic Progressions"] },
          { title: "Geometry and Trigonometry", topics: ["Triangles", "Coordinate Geometry", "Introduction to Trigonometry", "Applications of Trigonometry", "Circles"] },
          { title: "Mensuration and Statistics", topics: ["Areas Related to Circles", "Surface Areas and Volumes", "Statistics", "Probability"] },
        ],
      },
    ],
  },

  [ExamType.CUSTOM]: {
    examType: ExamType.CUSTOM,
    title: "Custom goal",
    subjects: [
      {
        title: "My syllabus",
        chapters: [
          { title: "Unit 1", topics: ["Topic 1", "Topic 2", "Topic 3"] },
          { title: "Unit 2", topics: ["Topic 1", "Topic 2", "Topic 3"] },
        ],
      },
    ],
  },
};

export function getExamSyllabus(examType: ExamType): ExamSyllabus | undefined {
  return syllabi[examType];
}

export const EXAM_SYLLABI = syllabi;
