import type { BankSeed } from "./types";

/**
 * NEET sheet. Biology carries half the paper (360 of 720 marks), so it gets the
 * largest share here, led by Human Physiology and Genetics — the two heaviest
 * units. Physics and Chemistry follow the same weightage-first ordering.
 */
export const neetBank: BankSeed[] = [
  // -------------------------------------------------------------- Biology
  {
    slug: "neet-bio-physio-co2-transport",
    examType: "NEET",
    subject: "Biology",
    chapter: "Breathing and Exchange of Gases",
    topic: "Transport of gases",
    type: "long_answer",
    difficulty: "medium",
    content:
      "Describe the three forms in which carbon dioxide is transported in human blood, giving the approximate percentage carried by each, and explain the role of carbonic anhydrase and the chloride shift.",
    correctAnswer:
      "~7% dissolved in plasma, ~20–25% as carbamino-haemoglobin, ~70% as bicarbonate.",
    solution:
      "1. Dissolved (~7%): CO₂ is ~20× more soluble than O₂, so a small fraction travels physically dissolved in plasma.\n2. Carbamino-haemoglobin (~20–25%): CO₂ binds the terminal amino groups of globin (not the haem iron). Binding is favoured by high pCO₂ and low pO₂ — the tissue condition.\n3. Bicarbonate (~70%): inside the RBC, carbonic anhydrase catalyses CO₂ + H₂O ⇌ H₂CO₃ ⇌ H⁺ + HCO₃⁻ extremely rapidly. HCO₃⁻ diffuses out into plasma and, to preserve electrical neutrality, Cl⁻ moves into the RBC — the chloride (Hamburger) shift. The H⁺ is buffered by haemoglobin.\nAt the alveoli every step reverses, driven by the low pCO₂ there.",
    hint: "The enzyme is the reason the bicarbonate route dominates — without it the reaction is far too slow for a single circulatory pass.",
    expectedMinutes: 7,
    tags: ["human-physiology", "high-yield"],
  },
  {
    slug: "neet-bio-genetics-dihybrid-linkage",
    examType: "NEET",
    subject: "Biology",
    chapter: "Principles of Inheritance and Variation",
    topic: "Dihybrid cross and linkage",
    type: "long_answer",
    difficulty: "medium",
    content:
      "Derive the phenotypic ratio of the dihybrid cross AaBb × AaBb for independently assorting genes. Then explain how and why the ratio changes if A and B are linked on the same chromosome.",
    correctAnswer:
      "9 : 3 : 3 : 1 when independent; parental combinations become over-represented when linked.",
    solution:
      "Independent assortment: each parent makes AB, Ab, aB, ab gametes in equal 1:1:1:1 proportion. The 4×4 Punnett square gives 9 A_B_ : 3 A_bb : 3 aaB_ : 1 aabb.\nLinked genes sit on the same chromosome and tend to travel together, so parental gamete types greatly outnumber recombinants; the recombinants arise only by crossing over. The observed ratio therefore deviates from 9:3:3:1, with a large excess of parental phenotypes.\nThe closer the loci, the lower the crossing-over frequency and the stronger the deviation — Morgan's work on Drosophila established that recombination frequency measures map distance (1% recombination = 1 map unit).",
    expectedMinutes: 8,
    tags: ["genetics", "linkage", "high-yield"],
  },
  {
    slug: "neet-bio-genetics-colour-blindness-pedigree",
    examType: "NEET",
    subject: "Biology",
    chapter: "Principles of Inheritance and Variation",
    topic: "Sex-linked inheritance",
    type: "short_answer",
    difficulty: "medium",
    content:
      "A colour-blind man marries a woman with normal vision whose father was colour blind. Write the genotypes of both parents and work out the expected phenotypes of their sons and daughters.",
    correctAnswer:
      "Father X^cY, mother X^C X^c. Sons: 50% colour blind. Daughters: 50% colour blind, 50% carriers. Overall 50% of children affected.",
    solution:
      "Colour blindness is X-linked recessive. The man is affected, so X^cY. The woman is unaffected but her father was X^cY and passed his only X to her, so she must be a carrier: X^C X^c.\nCross X^cY × X^C X^c gives: X^C X^c (carrier daughter), X^c X^c (colour-blind daughter), X^C Y (normal son), X^c Y (colour-blind son) — each 25%.\nSo half the daughters are colour blind (unusual for an X-linked trait, and possible here only because the father is affected) and half the sons are colour blind.",
    hint: "An unaffected daughter of an affected father is necessarily a carrier — she has no other source for that X.",
    expectedMinutes: 6,
    tags: ["pedigree", "X-linked", "high-yield"],
  },
  {
    slug: "neet-bio-molecular-lac-operon",
    examType: "NEET",
    subject: "Biology",
    chapter: "Molecular Basis of Inheritance",
    topic: "Gene regulation",
    type: "long_answer",
    difficulty: "medium",
    content:
      "Describe the lac operon of E. coli. Name its structural genes and their products, and explain its state in the presence and absence of lactose.",
    correctAnswer:
      "z (β-galactosidase), y (permease), a (transacetylase), controlled by i (repressor) acting on the operator; lactose-derived allolactose is the inducer.",
    solution:
      "Components: regulatory gene i (produces the repressor), promoter p, operator o, and structural genes z, y, a.\n• z → β-galactosidase, hydrolyses lactose into glucose and galactose.\n• y → permease, increases lactose uptake across the membrane.\n• a → transacetylase.\nAbsence of lactose: the i gene's repressor binds the operator, blocking RNA polymerase from transcribing z, y, a. The operon is OFF.\nPresence of lactose: a little lactose enters and is isomerised to allolactose, which acts as the inducer. It binds the repressor and changes its conformation so it can no longer bind the operator. RNA polymerase transcribes the polycistronic mRNA and the operon is ON.\nThis is negative regulation by induction — the classic Jacob–Monod model. (Note it is also subject to positive control by CAP-cAMP when glucose is scarce.)",
    expectedMinutes: 8,
    tags: ["operon", "gene-regulation", "high-yield"],
  },
  {
    slug: "neet-bio-biotech-recombinant-insulin",
    examType: "NEET",
    subject: "Biology",
    chapter: "Biotechnology and its Applications",
    topic: "Recombinant DNA products",
    type: "long_answer",
    difficulty: "medium",
    content:
      "Outline the production of recombinant human insulin (Humulin) by Eli Lilly in 1983. Why could the mature hormone not simply be expressed as a single chain, and how was this solved?",
    correctAnswer:
      "The A and B chains were synthesised separately in E. coli and joined in vitro by disulphide bonds.",
    solution:
      "Mature insulin is two peptides — chain A (21 aa) and chain B (30 aa) — joined by disulphide bridges. In the body it is made as pro-insulin, a single chain including a C-peptide that is excised during maturation; bacteria cannot carry out that processing.\nThe solution: DNA sequences coding for chain A and chain B were prepared separately and each inserted into a plasmid vector, which was introduced into E. coli. The two chains were expressed in separate cultures, extracted, and then combined in vitro under conditions that form the correct disulphide linkages, yielding functional human insulin.\nThe advantage over earlier animal-derived insulin (from slaughtered cattle and pigs) is that the sequence is exactly human, so allergic reactions are avoided, and supply is not limited by abattoir output.",
    expectedMinutes: 7,
    tags: ["rDNA", "high-yield"],
  },
  {
    slug: "neet-bio-plant-c4-photorespiration",
    examType: "NEET",
    subject: "Biology",
    chapter: "Photosynthesis in Higher Plants",
    topic: "C4 pathway",
    type: "long_answer",
    difficulty: "medium",
    content:
      "Explain the C4 (Hatch–Slack) pathway and Kranz anatomy, and account for the absence of photorespiration in C4 plants.",
    correctAnswer:
      "PEP carboxylase fixes CO₂ in mesophyll cells; the C4 acid is decarboxylated in bundle-sheath cells, raising CO₂ there so RuBisCO does not act as an oxygenase.",
    solution:
      "Kranz anatomy: bundle-sheath cells form a wreath around the vascular bundles; they are thick-walled, impervious to gas exchange and have no intercellular spaces.\nMesophyll: PEP carboxylase (which has no affinity for O₂) fixes CO₂ onto phosphoenolpyruvate, forming the 4-carbon oxaloacetate, converted to malate.\nMalate moves to the bundle sheath and is decarboxylated, releasing CO₂ right where RuBisCO sits and regenerating pyruvate, which returns to the mesophyll.\nThe key consequence: the local CO₂ concentration in the bundle sheath becomes very high, so RuBisCO — which is a competitive oxygenase as well as a carboxylase — is saturated with CO₂ and O₂ cannot compete. Photorespiration is therefore effectively abolished, which is why C4 plants such as maize, sugarcane and sorghum outperform C3 plants at high temperature and light.",
    hint: "The pathway does not make photorespiration impossible chemically — it makes it kinetically irrelevant by flooding RuBisCO with CO₂.",
    expectedMinutes: 8,
    tags: ["plant-physiology", "high-yield"],
  },
  {
    slug: "neet-bio-plant-transpiration-pull",
    examType: "NEET",
    subject: "Biology",
    chapter: "Transport in Plants",
    topic: "Ascent of sap",
    type: "long_answer",
    difficulty: "easy",
    content:
      "Explain the cohesion–tension (transpiration pull) theory of water ascent in tall trees, and state the properties of water that make it possible.",
    correctAnswer:
      "Transpiration creates negative pressure transmitted down a continuous water column held together by cohesion and adhesion.",
    solution:
      "Water evaporates from the mesophyll cell walls into the sub-stomatal cavity and out through the stomata. This creates a negative pressure (tension) at the top of the xylem.\nBecause water molecules are strongly hydrogen-bonded to each other (cohesion) and to the lignified xylem walls (adhesion), the water column behaves like a continuous thread and does not break under this tension. The high surface tension and tensile strength of water sustain the column even in trees over 100 m tall.\nXylem tracheids and vessels are dead, hollow and lignified, offering a low-resistance path. Root pressure exists but is small and cannot account for tall trees; transpiration pull is the dominant mechanism.",
    expectedMinutes: 6,
    tags: ["plant-physiology", "xylem"],
  },
  {
    slug: "neet-bio-repro-menstrual-cycle-hormones",
    examType: "NEET",
    subject: "Biology",
    chapter: "Human Reproduction",
    topic: "Menstrual cycle",
    type: "long_answer",
    difficulty: "medium",
    content:
      "Describe the phases of the human menstrual cycle with the associated changes in FSH, LH, oestrogen and progesterone, and identify what triggers ovulation.",
    correctAnswer:
      "Menstrual, follicular/proliferative, ovulatory, luteal/secretory phases; ovulation is triggered by the mid-cycle LH surge.",
    solution:
      "Menstrual phase (days 1–5): the endometrium breaks down and is shed because the corpus luteum of the previous cycle has regressed, so progesterone falls.\nFollicular / proliferative (days 6–13): FSH rises and stimulates follicle growth; the growing follicle secretes increasing oestrogen, which regenerates the endometrium.\nOvulatory (~day 14): high oestrogen exerts positive feedback on the pituitary, producing a sharp LH surge (with a smaller FSH peak). This surge ruptures the Graafian follicle and releases the secondary oocyte.\nLuteal / secretory (days 15–28): the ruptured follicle becomes the corpus luteum, secreting large amounts of progesterone that maintain the endometrium for implantation. If fertilisation does not occur the corpus luteum degenerates, progesterone falls, and menstruation begins again.",
    hint: "Oestrogen switches from negative to positive feedback just before ovulation — that switch is the whole trigger.",
    expectedMinutes: 8,
    tags: ["human-reproduction", "high-yield"],
  },
  {
    slug: "neet-bio-ecology-population-growth-rate",
    examType: "NEET",
    subject: "Biology",
    chapter: "Organisms and Populations",
    topic: "Population attributes",
    type: "numeric",
    difficulty: "easy",
    content:
      "In a population of 100 individuals over one year there are 12 births, 4 deaths, 3 immigrants and 1 emigrant. Calculate the intrinsic rate of natural increase and the population growth rate per capita. Define carrying capacity.",
    correctAnswer:
      "Net change = +10 per 100, i.e. per-capita growth rate r = 0.10 per year",
    solution:
      "Population change = (natality + immigration) − (mortality + emigration) = (12 + 3) − (4 + 1) = 10 individuals.\nPer-capita growth rate r = 10/100 = 0.10 per year. The intrinsic rate of natural increase considering only births and deaths is (12 − 4)/100 = 0.08 per year.\nCarrying capacity (K) is the maximum population size an environment can sustain indefinitely given its resources; in the logistic model dN/dt = rN(K − N)/K, growth slows as N approaches K and stops at N = K, producing the sigmoid curve.",
    expectedMinutes: 4,
    tags: ["ecology", "logistic-growth"],
  },
  {
    slug: "neet-bio-ecology-energy-pyramid",
    examType: "NEET",
    subject: "Biology",
    chapter: "Ecosystem",
    topic: "Ecological pyramids",
    type: "short_answer",
    difficulty: "easy",
    content:
      "State the 10 per cent law. Explain why the pyramid of energy is always upright, while pyramids of number and biomass can be inverted — give an example of each inversion.",
    correctAnswer:
      "Only ~10% of energy passes to the next trophic level, so energy always decreases upward; number and biomass pyramids can invert.",
    solution:
      "Lindeman's 10 per cent law: only about 10% of the energy at one trophic level is incorporated into the next; the rest is lost as heat in respiration and in unassimilated material.\nBecause energy transfer is unidirectional and always lossy, each successive level holds less energy than the one below — so the energy pyramid can never invert.\nInverted pyramid of number: a single large tree supports many herbivorous insects, which support fewer birds — the producer level is narrower than the consumer level above it.\nInverted pyramid of biomass: in a sea, the standing crop of phytoplankton at any instant is smaller than that of the zooplankton feeding on them, because phytoplankton reproduce and are consumed extremely fast. Standing-crop biomass is a snapshot; it does not reflect productivity over time.",
    expectedMinutes: 5,
    tags: ["ecology", "high-yield"],
  },
  {
    slug: "neet-bio-cell-mitosis-vs-meiosis",
    examType: "NEET",
    subject: "Biology",
    chapter: "Cell Cycle and Cell Division",
    topic: "Mitosis and meiosis",
    type: "long_answer",
    difficulty: "easy",
    content:
      "Tabulate five differences between mitosis and meiosis. Describe crossing over — where and when it occurs — and state its evolutionary significance.",
    correctAnswer:
      "Crossing over occurs at the pachytene stage of prophase I, between non-sister chromatids of homologous chromosomes, mediated by recombinase at chiasmata.",
    solution:
      "Differences: (1) mitosis gives 2 daughter cells, meiosis 4; (2) mitosis is equational (2n→2n), meiosis reductional (2n→n); (3) mitosis has one division, meiosis two; (4) no synapsis or crossing over in mitosis, both occur in prophase I of meiosis; (5) mitosis occurs in somatic cells for growth and repair, meiosis in germ cells for gamete formation.\nCrossing over: during pachytene of prophase I, after synapsis has paired homologues into bivalents via the synaptonemal complex, non-sister chromatids exchange corresponding segments. The enzyme recombinase mediates it, and the exchange points become visible as chiasmata at diplotene.\nSignificance: it recombines maternal and paternal alleles, so — together with independent assortment — it generates the genetic variation on which natural selection acts.",
    expectedMinutes: 7,
    tags: ["cell-division", "high-yield"],
  },
  {
    slug: "neet-bio-evolution-hardy-weinberg",
    examType: "NEET",
    subject: "Biology",
    chapter: "Evolution",
    topic: "Hardy–Weinberg principle",
    type: "numeric",
    difficulty: "medium",
    content:
      "In a population at Hardy–Weinberg equilibrium, 9% of individuals show a recessive phenotype. Calculate the allele frequencies and the frequencies of all three genotypes. List the five conditions that must hold for the equilibrium.",
    correctAnswer: "q = 0.3, p = 0.7; AA = 0.49, Aa = 0.42, aa = 0.09",
    solution:
      "The recessive phenotype corresponds to aa, so q² = 0.09 and q = 0.3. Then p = 1 − q = 0.7.\nGenotype frequencies: p² = 0.49 (AA), 2pq = 2(0.7)(0.3) = 0.42 (Aa), q² = 0.09 (aa). These sum to 1.00. ✓\nNote 42% of the population carries the recessive allele without showing it — far more than the 9% affected.\nConditions: (1) no mutation, (2) no gene flow / migration, (3) no genetic drift (population must be very large), (4) no natural selection, (5) random mating. Any deviation from these constitutes evolution, which is exactly why the principle is useful as a null model.",
    hint: "Work backwards from the recessive phenotype — it is the only genotype you can read directly off the phenotype.",
    expectedMinutes: 5,
    tags: ["evolution", "genetics", "high-yield"],
  },
  {
    slug: "neet-bio-health-plasmodium-life-cycle",
    examType: "NEET",
    subject: "Biology",
    chapter: "Human Health and Disease",
    topic: "Malaria",
    type: "long_answer",
    difficulty: "medium",
    content:
      "Describe the life cycle of Plasmodium, distinguishing the roles of the human and mosquito hosts. Explain what causes the periodic fever and chills.",
    correctAnswer:
      "Human is the secondary/intermediate host (asexual phase); female Anopheles is the primary/definitive host (sexual phase). Fever is caused by haemozoin released on RBC rupture.",
    solution:
      "A female Anopheles mosquito injects sporozoites with its saliva. These reach the liver and multiply (exo-erythrocytic schizogony), then enter red blood cells and multiply further, rupturing them and releasing more merozoites which infect fresh RBCs.\nRBC rupture releases the toxin haemozoin, which is responsible for the characteristic recurring chill and high fever — the periodicity matches the synchronised cycle of RBC lysis (every 48 h for P. vivax).\nSome merozoites develop into male and female gametocytes. When another female Anopheles bites, it takes these up; fertilisation and further development occur in the mosquito's gut, producing sporozoites that migrate to the salivary glands, ready for the next host.\nBecause the sexual phase occurs in the mosquito, the mosquito is the definitive (primary) host and the human is the intermediate host — a point frequently reversed in answers.",
    expectedMinutes: 7,
    tags: ["parasitology", "high-yield"],
  },
  {
    slug: "neet-bio-enzymes-competitive-inhibition",
    examType: "NEET",
    subject: "Biology",
    chapter: "Biomolecules",
    topic: "Enzyme inhibition",
    type: "short_answer",
    difficulty: "medium",
    content:
      "Explain competitive inhibition using the malonate–succinate dehydrogenase example. State the effect on Km and Vmax and explain why the inhibition can be overcome.",
    correctAnswer:
      "Km increases, Vmax unchanged; excess substrate outcompetes the inhibitor.",
    solution:
      "Malonate closely resembles succinate in structure, so it binds the active site of succinate dehydrogenase without being converted to product. It therefore blocks the enzyme by competing with the true substrate for the same site.\nVmax is unchanged because at sufficiently high substrate concentration the substrate wins the competition and every enzyme molecule still turns over at its maximum rate.\nKm increases (apparent lower affinity) because more substrate is now needed to reach half-maximal velocity.\nThis reversibility is what makes competitive inhibition medically useful — it underlies the action of many drugs, and is why the inhibition can be relieved simply by raising substrate concentration.",
    expectedMinutes: 5,
    tags: ["enzymes", "kinetics"],
  },
  {
    slug: "neet-bio-animal-kingdom-chordata",
    examType: "NEET",
    subject: "Biology",
    chapter: "Animal Kingdom",
    topic: "Phylum Chordata",
    type: "long_answer",
    difficulty: "easy",
    content:
      "State the three fundamental chordate characters. Classify Phylum Chordata into its subphyla and, for Vertebrata, list the classes with one distinguishing feature and one example each.",
    correctAnswer:
      "Notochord, dorsal hollow nerve cord, paired pharyngeal gill slits; subphyla Urochordata, Cephalochordata, Vertebrata.",
    solution:
      "Fundamental characters: a notochord, a dorsal hollow nerve cord, and paired pharyngeal gill slits (plus a post-anal tail).\nSubphyla: Urochordata (notochord only in the larval tail, e.g. Ascidia), Cephalochordata (notochord along the whole body throughout life, e.g. Branchiostoma), Vertebrata (notochord replaced by a vertebral column in the adult).\nVertebrate classes:\n• Cyclostomata — jawless, sucking mouth, e.g. Petromyzon.\n• Chondrichthyes — cartilaginous endoskeleton, ventral mouth, e.g. Scoliodon.\n• Osteichthyes — bony skeleton, operculum and air bladder, e.g. Labeo.\n• Amphibia — can live on land and water, three-chambered heart, e.g. Rana.\n• Reptilia — dry cornified skin, epidermal scales, e.g. Chameleon.\n• Aves — feathers, forelimbs as wings, pneumatic bones, e.g. Corvus.\n• Mammalia — mammary glands, hair, external pinna, e.g. Homo sapiens.",
    expectedMinutes: 8,
    tags: ["taxonomy", "diversity"],
  },

  // ------------------------------------------------------------ Chemistry
  {
    slug: "neet-chem-distinguish-aldehyde-ketone",
    examType: "NEET",
    subject: "Chemistry",
    chapter: "Aldehydes, Ketones and Carboxylic Acids",
    topic: "Distinguishing tests",
    type: "short_answer",
    difficulty: "easy",
    content:
      "Give two chemical tests that distinguish acetaldehyde from acetone. Explain why the iodoform test would be a poor choice here.",
    correctAnswer:
      "Tollens' reagent and Fehling's solution: acetaldehyde gives a positive result, acetone does not. The iodoform test is positive for both.",
    solution:
      "Tollens' test: warm with ammoniacal silver nitrate. Acetaldehyde, being an aldehyde, reduces Ag⁺ to metallic silver, giving a silver mirror. Acetone gives no reaction.\nFehling's test: warm with Fehling's solution. Acetaldehyde reduces Cu²⁺ to Cu₂O, a red-brown precipitate. Acetone gives no reaction. (Aromatic aldehydes are the known exception to Fehling's.)\nThe iodoform test fails as a discriminator because it detects the CH₃CO– group — both CH₃CHO and CH₃COCH₃ contain it, so both give the yellow CHI₃ precipitate.",
    expectedMinutes: 4,
    tags: ["qualitative-analysis", "tollens", "fehling"],
  },
  {
    slug: "neet-chem-mot-oxygen-species",
    examType: "NEET",
    subject: "Chemistry",
    chapter: "Chemical Bonding and Molecular Structure",
    topic: "Molecular orbital theory",
    type: "short_answer",
    difficulty: "medium",
    content:
      "Using molecular orbital theory, compare O₂, O₂⁻ (superoxide) and O₂²⁻ (peroxide): give the bond order, number of unpaired electrons, magnetic behaviour, and predict the order of bond lengths.",
    correctAnswer:
      "O₂: BO 2, 2 unpaired, paramagnetic. O₂⁻: BO 1.5, 1 unpaired, paramagnetic. O₂²⁻: BO 1, 0 unpaired, diamagnetic. Bond length O₂ < O₂⁻ < O₂²⁻.",
    solution:
      "O₂ has 16 electrons; the last two occupy the degenerate π* orbitals singly with parallel spins. Bond order = (10 − 6)/2 = 2, two unpaired electrons, paramagnetic — MOT's classic success, since valence bond theory wrongly predicts O₂ to be diamagnetic.\nO₂⁻ adds one electron to π*: bond order = (10 − 7)/2 = 1.5, one unpaired electron, paramagnetic.\nO₂²⁻ adds two: bond order = (10 − 8)/2 = 1, no unpaired electrons, diamagnetic.\nBond length varies inversely with bond order, so O₂ (shortest) < O₂⁻ < O₂²⁻ (longest).",
    hint: "Each added electron goes into an antibonding π* orbital, so each one costs half a unit of bond order.",
    expectedMinutes: 6,
    tags: ["MOT", "bond-order", "high-yield"],
  },
  {
    slug: "neet-chem-kinetics-activation-energy",
    examType: "NEET",
    subject: "Chemistry",
    chapter: "Chemical Kinetics",
    topic: "Arrhenius equation",
    type: "numeric",
    difficulty: "medium",
    content:
      "The rate constant of a reaction doubles when the temperature rises from 300 K to 310 K. Calculate the activation energy. (R = 8.314 J K⁻¹ mol⁻¹)",
    correctAnswer: "Ea ≈ 53.6 kJ mol⁻¹",
    solution:
      "The Arrhenius equation in two-point form:\nlog(k₂/k₁) = (Ea/2.303R) · (T₂ − T₁)/(T₁T₂).\nlog 2 = 0.3010, T₂ − T₁ = 10, T₁T₂ = 93 000.\nEa = 2.303 × 8.314 × 0.3010 × 93 000/10 = 19.147 × 0.3010 × 9300 ≈ 53 600 J mol⁻¹ ≈ 53.6 kJ mol⁻¹.\nThis is the origin of the rule of thumb that reaction rates roughly double per 10 °C near room temperature — it holds only for Ea around 50 kJ mol⁻¹.",
    expectedMinutes: 5,
    tags: ["arrhenius", "activation-energy"],
  },
  {
    slug: "neet-chem-solutions-molality-mole-fraction",
    examType: "NEET",
    subject: "Chemistry",
    chapter: "Solutions",
    topic: "Concentration terms",
    type: "numeric",
    difficulty: "easy",
    content:
      "Calculate the molality and the mole fraction of glucose in a 20% (w/w) aqueous glucose solution. (Molar mass of glucose = 180 g mol⁻¹)",
    correctAnswer: "molality ≈ 1.39 mol kg⁻¹; mole fraction of glucose ≈ 0.024",
    solution:
      "Take 100 g of solution: 20 g glucose + 80 g water.\nn(glucose) = 20/180 = 0.1111 mol; n(water) = 80/18 = 4.444 mol.\nMolality = moles of solute per kg of *solvent* = 0.1111/0.080 = 1.39 mol kg⁻¹.\nMole fraction x(glucose) = 0.1111/(0.1111 + 4.444) = 0.0244.\nA common error is dividing by the mass of the solution rather than the solvent when computing molality.",
    expectedMinutes: 4,
    tags: ["molality", "mole-fraction"],
  },
  {
    slug: "neet-chem-electrolysis-copper-deposit",
    examType: "NEET",
    subject: "Chemistry",
    chapter: "Electrochemistry",
    topic: "Faraday's laws",
    type: "numeric",
    difficulty: "easy",
    content:
      "A current of 2.0 A is passed through a CuSO₄ solution for 30 minutes. Calculate the mass of copper deposited at the cathode. (Atomic mass Cu = 63.5, F = 96500 C mol⁻¹)",
    correctAnswer: "≈ 1.18 g",
    solution:
      "Charge Q = It = 2.0 × 30 × 60 = 3600 C.\nMoles of electrons = 3600/96500 = 0.0373 mol.\nCu²⁺ + 2e⁻ → Cu, so moles of Cu = 0.0373/2 = 0.01865 mol.\nMass = 0.01865 × 63.5 ≈ 1.18 g.",
    hint: "The '2' in Cu²⁺ + 2e⁻ → Cu is where most marks are lost.",
    expectedMinutes: 4,
    tags: ["faraday", "electrolysis"],
  },
  {
    slug: "neet-chem-pblock-nh3-vs-ph3",
    examType: "NEET",
    subject: "Chemistry",
    chapter: "The p-Block Elements",
    topic: "Group 15 hydrides",
    type: "short_answer",
    difficulty: "medium",
    content:
      "Explain why NH₃ is a far stronger base than PH₃, and why the H–N–H angle (107°) is much larger than H–P–H (93.5°).",
    correctAnswer:
      "N is small with a concentrated lone pair (stronger donor); the large N–H bond-pair repulsion in a small atom opens the angle, while P uses nearly pure p orbitals.",
    solution:
      "Basicity: basic strength depends on how readily the lone pair is donated. Nitrogen is much smaller, so its lone pair is confined to a small volume and has high charge density, making it a strong donor. Phosphorus is larger and more diffuse, so its lone pair is less available — basicity falls down the group: NH₃ > PH₃ > AsH₃ > SbH₃ > BiH₃.\nBond angle: in NH₃ nitrogen is effectively sp³ hybridised, and because N is small the three bond pairs are close together and repel strongly, holding the angle near the tetrahedral value (107°, reduced from 109.5° by the lone pair).\nIn PH₃ the larger phosphorus atom shows very little hybridisation and bonds using nearly pure 3p orbitals, which are mutually at 90°; the observed 93.5° is close to that. The larger size also spaces the bond pairs out so they repel less.",
    expectedMinutes: 5,
    tags: ["inorganic", "bond-angle", "basicity"],
  },
  {
    slug: "neet-chem-haloalkane-sn1-sn2",
    examType: "NEET",
    subject: "Chemistry",
    chapter: "Haloalkanes and Haloarenes",
    topic: "Nucleophilic substitution",
    type: "long_answer",
    difficulty: "medium",
    content:
      "Compare SN1 and SN2 mechanisms in terms of molecularity, kinetics, intermediate, stereochemical outcome and the reactivity order of primary, secondary and tertiary halides. Explain the reason for the opposite reactivity orders.",
    correctAnswer:
      "SN2: bimolecular, second-order, no intermediate, inversion; reactivity 1° > 2° > 3°. SN1: unimolecular, first-order, carbocation intermediate, racemisation; reactivity 3° > 2° > 1°.",
    solution:
      "SN2 is a single concerted step: the nucleophile attacks from the side opposite the leaving group through a five-coordinate transition state. Rate = k[substrate][nucleophile]. The configuration is inverted (Walden inversion). Bulky groups around the carbon block the backside approach, so reactivity falls 1° > 2° > 3°.\nSN1 proceeds in two steps: slow ionisation to a planar carbocation, then fast attack by the nucleophile. Rate = k[substrate] only. Because the carbocation is planar, the nucleophile attacks either face, giving racemisation (in practice, partial racemisation with slight inversion). Reactivity follows carbocation stability, so 3° > 2° > 1°.\nThe orders are opposite because SN2 is limited by *steric access* to the carbon while SN1 is limited by *electronic stability* of the intermediate — and alkyl substitution helps the second while hindering the first.",
    expectedMinutes: 7,
    tags: ["mechanism", "stereochemistry", "high-yield"],
  },
  {
    slug: "neet-chem-coordination-iupac-naming",
    examType: "NEET",
    subject: "Chemistry",
    chapter: "Coordination Compounds",
    topic: "IUPAC nomenclature",
    type: "short_answer",
    difficulty: "easy",
    content:
      "Write the IUPAC name, the oxidation state of the central metal and the coordination number for: (a) K₃[Fe(CN)₆] (b) [Co(NH₃)₅Cl]Cl₂ (c) [Pt(NH₃)₂Cl₂].",
    correctAnswer:
      "(a) potassium hexacyanidoferrate(III), Fe(+3), CN 6. (b) pentaamminechloridocobalt(III) chloride, Co(+3), CN 6. (c) diamminedichloridoplatinum(II), Pt(+2), CN 4.",
    solution:
      "(a) Six CN⁻ each −1 with an overall −3 charge on the complex ion: x + 6(−1) = −3, so Fe is +3. Anionic complexes take the -ate suffix on the Latin stem: ferrate.\n(b) Two chlorides sit outside the sphere, so the complex ion is 2+: x + 0(5 NH₃) + (−1) = +2, giving Co(+3). Ligands are named alphabetically — ammine before chlorido.\n(c) Neutral complex: x + 0 + 2(−1) = 0, so Pt(+2), coordination number 4. This is cisplatin when in the cis form, used as an anti-cancer drug.\nCoordination number counts donor atoms bonded to the metal, not the number of ligand species.",
    expectedMinutes: 5,
    tags: ["nomenclature", "oxidation-state"],
  },
  {
    slug: "neet-chem-biomolecules-protein-structure",
    examType: "NEET",
    subject: "Chemistry",
    chapter: "Biomolecules",
    topic: "Protein structure",
    type: "short_answer",
    difficulty: "easy",
    content:
      "Define the primary, secondary, tertiary and quaternary structures of proteins. Differentiate the α-helix from the β-pleated sheet, and explain what denaturation destroys.",
    correctAnswer:
      "Primary = sequence; secondary = local H-bonded folding (α-helix / β-sheet); tertiary = overall 3D shape; quaternary = arrangement of subunits.",
    solution:
      "Primary: the linear sequence of amino acids joined by peptide bonds — the only level held by covalent bonds.\nSecondary: regular local folding stabilised by hydrogen bonds between backbone C=O and N–H groups.\n• α-helix: a single chain coiled right-handed, with intramolecular H-bonds between every first and fourth residue. Example: keratin.\n• β-pleated sheet: chains stretched side by side, held by intermolecular H-bonds, giving a pleated appearance. Example: silk fibroin.\nTertiary: the overall three-dimensional folding of the whole chain, stabilised by disulphide bridges, hydrophobic interactions, ionic and hydrogen bonds.\nQuaternary: the spatial arrangement of two or more polypeptide subunits, e.g. the four chains of haemoglobin.\nDenaturation (by heat, pH or urea) destroys secondary, tertiary and quaternary structure but leaves the primary structure intact — which is why a boiled egg's protein sequence is unchanged even though the protein is no longer functional.",
    expectedMinutes: 5,
    tags: ["proteins", "high-yield"],
  },

  // -------------------------------------------------------------- Physics
  {
    slug: "neet-phy-rolling-solid-vs-hollow",
    examType: "NEET",
    subject: "Physics",
    chapter: "System of Particles and Rotational Motion",
    topic: "Rolling bodies",
    type: "short_answer",
    difficulty: "medium",
    content:
      "A solid sphere and a hollow sphere of identical mass and radius are released together from the top of an incline and roll without slipping. Which reaches the bottom first? Justify quantitatively, and state whether the answer depends on their mass or radius.",
    correctAnswer:
      "The solid sphere, with a = (5/7) g sin θ against (3/5) g sin θ. Independent of mass and radius.",
    solution:
      "For rolling without slipping, a = g sin θ/(1 + k²/R²).\nSolid sphere: I = (2/5)MR², so k²/R² = 2/5 and a = g sin θ/(7/5) = (5/7) g sin θ ≈ 0.714 g sin θ.\nHollow sphere: I = (2/3)MR², so k²/R² = 2/3 and a = g sin θ/(5/3) = (3/5) g sin θ = 0.600 g sin θ.\nThe solid sphere has the larger acceleration and arrives first.\nBecause k²/R² is a pure number depending only on the *shape* of the body, the result is independent of both mass and radius — a hollow sphere always loses to a solid one, whatever its size. Physically, the hollow body carries more of its mass far from the axis, so more of the released potential energy goes into rotational rather than translational kinetic energy.",
    hint: "Everything hinges on k²/R², the shape factor — mass and radius cancel out entirely.",
    expectedMinutes: 6,
    tags: ["rolling", "moment-of-inertia", "high-yield"],
  },
  {
    slug: "neet-phy-wheatstone-bridge-derivation",
    examType: "NEET",
    subject: "Physics",
    chapter: "Current Electricity",
    topic: "Wheatstone bridge",
    type: "derivation",
    difficulty: "medium",
    content:
      "Draw a Wheatstone bridge and derive its balance condition using Kirchhoff's laws. Explain why the balance method is more accurate than measuring the unknown resistance with an ammeter and voltmeter.",
    correctAnswer: "Balance condition: P/Q = R/S (galvanometer current zero)",
    solution:
      "Label the four arms P, Q, R, S with a galvanometer across BD and a cell across AC.\nAt balance the galvanometer reads zero, so no current flows through BD and B and D are at the same potential.\nThe current I₁ then flows through P and Q in series, and I₂ through R and S in series.\nEqual potentials at B and D give: I₁P = I₂R and I₁Q = I₂S.\nDividing the two: P/Q = R/S.\nAccuracy: this is a *null* method — the result depends only on the ratio of resistances at the moment the galvanometer reads exactly zero, not on the galvanometer's calibration, the cell's emf, or its internal resistance. A deflection method using an ammeter and voltmeter is limited by the accuracy of both instruments and disturbed by their own resistances.",
    expectedMinutes: 7,
    tags: ["kirchhoff", "null-method"],
  },
  {
    slug: "neet-phy-carnot-efficiency",
    examType: "NEET",
    subject: "Physics",
    chapter: "Thermodynamics",
    topic: "Heat engines",
    type: "numeric",
    difficulty: "easy",
    content:
      "A Carnot engine operates between reservoirs at 500 K and 300 K and absorbs 1000 J per cycle from the hot reservoir. Find its efficiency, the work done per cycle and the heat rejected. State what would be needed for 100% efficiency.",
    correctAnswer: "η = 40%, W = 400 J, Q_rejected = 600 J",
    solution:
      "η = 1 − T_cold/T_hot = 1 − 300/500 = 0.40, i.e. 40%.\nW = ηQ_hot = 0.40 × 1000 = 400 J.\nQ_rejected = Q_hot − W = 1000 − 400 = 600 J.\n100% efficiency would require T_cold = 0 K, which is unattainable by the third law — so no heat engine, however perfect, can convert all absorbed heat into work. This is the Kelvin–Planck statement of the second law.",
    expectedMinutes: 4,
    tags: ["carnot", "second-law"],
  },
  {
    slug: "neet-phy-concave-mirror-image",
    examType: "NEET",
    subject: "Physics",
    chapter: "Ray Optics and Optical Instruments",
    topic: "Mirror formula",
    type: "numeric",
    difficulty: "easy",
    content:
      "An object is placed 15 cm in front of a concave mirror of focal length 10 cm. Find the image distance, magnification and the nature of the image.",
    correctAnswer:
      "v = −30 cm (30 cm in front), m = −2, so the image is real, inverted and magnified two-fold",
    solution:
      "Using the Cartesian sign convention with light travelling towards the mirror: u = −15 cm, f = −10 cm.\n1/v + 1/u = 1/f ⟹ 1/v = 1/f − 1/u = −1/10 + 1/15 = (−3 + 2)/30 = −1/30, so v = −30 cm.\nThe negative sign means the image forms 30 cm in front of the mirror, on the same side as the object — hence real.\nm = −v/u = −(−30)/(−15) = −2. Negative magnification means inverted; |m| = 2 means twice the object's size.\nThis is consistent with the object being between f and 2f, which always gives a real, inverted, magnified image beyond 2f.",
    hint: "Apply the sign convention before substituting, and check the answer against the standard object-position cases.",
    expectedMinutes: 4,
    tags: ["mirror-formula", "sign-convention"],
  },
  {
    slug: "neet-phy-doppler-approaching-source",
    examType: "NEET",
    subject: "Physics",
    chapter: "Waves",
    topic: "Doppler effect",
    type: "numeric",
    difficulty: "easy",
    content:
      "A source emitting sound at 500 Hz moves towards a stationary observer at 30 m s⁻¹. Taking the speed of sound as 330 m s⁻¹, find the apparent frequency. What frequency does the observer hear once the source has passed?",
    correctAnswer: "550 Hz approaching; 458.3 Hz receding",
    solution:
      "Approaching: f' = f · v/(v − vs) = 500 × 330/(330 − 30) = 500 × 330/300 = 550 Hz.\nReceding: f' = f · v/(v + vs) = 500 × 330/360 = 458.3 Hz.\nThe abrupt drop of about 92 Hz as the source passes is the familiar change in pitch of a passing siren. Note the rise and the fall are not symmetric about 500 Hz, because the source speed appears in the denominator.",
    expectedMinutes: 4,
    tags: ["doppler", "sound"],
  },
  {
    slug: "neet-phy-de-broglie-accelerated-electron",
    examType: "NEET",
    subject: "Physics",
    chapter: "Dual Nature of Radiation and Matter",
    topic: "de Broglie wavelength",
    type: "numeric",
    difficulty: "easy",
    content:
      "Calculate the de Broglie wavelength of an electron accelerated from rest through a potential difference of 100 V. Explain why this makes electrons useful in microscopy.",
    correctAnswer: "λ ≈ 1.227 Å (0.1227 nm)",
    solution:
      "An electron accelerated through V gains kinetic energy eV, so p = √(2meV) and\nλ = h/√(2meV) = 12.27/√V Å.\nFor V = 100: λ = 12.27/10 = 1.227 Å.\nThis is roughly 4000 times shorter than visible light (~5000 Å). Since the resolving power of a microscope is limited by the wavelength used, electron microscopes can resolve structures thousands of times smaller than the best optical microscope — which is exactly why they can image viruses and organelles.",
    hint: "Memorise λ = 12.27/√V Å for electrons — it saves the whole derivation under exam time pressure.",
    expectedMinutes: 4,
    tags: ["de-broglie", "matter-waves"],
  },
  {
    slug: "neet-phy-pn-junction-biasing",
    examType: "NEET",
    subject: "Physics",
    chapter: "Semiconductor Electronics",
    topic: "p-n junction diode",
    type: "long_answer",
    difficulty: "medium",
    content:
      "Explain the formation of the depletion region and barrier potential in a p-n junction. Describe the behaviour under forward and reverse bias, and sketch the I–V characteristic.",
    correctAnswer:
      "Forward bias narrows the depletion region and current rises sharply past the knee voltage; reverse bias widens it, leaving only a small leakage current until breakdown.",
    solution:
      "Formation: at the junction, electrons from the n-side diffuse into the p-side and holes diffuse the other way, recombining near the boundary. This leaves immobile negative acceptor ions on the p-side and positive donor ions on the n-side — a depletion region devoid of free carriers, with a built-in barrier potential (~0.7 V for Si, ~0.3 V for Ge) that opposes further diffusion.\nForward bias (p to +, n to −): the applied field opposes the barrier field, so the depletion width and barrier potential both shrink. Beyond the knee (threshold) voltage current increases sharply and roughly exponentially; the diode conducts.\nReverse bias (p to −, n to +): the applied field reinforces the barrier, widening the depletion region. Only a very small reverse saturation current flows, carried by minority carriers, and it is nearly independent of voltage — until breakdown, where current increases abruptly.\nThe I–V curve is therefore strongly asymmetric, which is what makes the diode useful as a rectifier.",
    expectedMinutes: 7,
    tags: ["semiconductors", "diode", "high-yield"],
  },
  {
    slug: "neet-phy-dipole-axial-equatorial",
    examType: "NEET",
    subject: "Physics",
    chapter: "Electrostatics",
    topic: "Electric dipole",
    type: "derivation",
    difficulty: "medium",
    content:
      "Derive the electric field at a point on the axis of a short electric dipole and at a point on its equatorial line. Compare their magnitudes and directions.",
    correctAnswer:
      "E_axial = 2kp/r³ (along p), E_equatorial = kp/r³ (opposite to p); E_axial = 2 × E_equatorial",
    solution:
      "Let the dipole be charges ±q separated by 2a, with dipole moment p = q(2a) directed from −q to +q.\nAxial point at distance r from the centre:\nE = kq/(r − a)² − kq/(r + a)² = kq · 4ar/(r² − a²)².\nFor a short dipole (r ≫ a) this becomes E_axial = 2kp/r³, directed along p.\nEquatorial point at distance r:\nBoth charges are at distance √(r² + a²), and the components perpendicular to the axis cancel while the components along the axis add:\nE = 2 · kq/(r² + a²) · a/√(r² + a²) = kp/(r² + a²)^{3/2}.\nFor r ≫ a this becomes E_equatorial = kp/r³, directed *antiparallel* to p.\nSo E_axial = 2 E_equatorial, and the two point in opposite senses. Both fall off as 1/r³, faster than a point charge's 1/r², because the two opposite charges increasingly cancel at large distance.",
    expectedMinutes: 8,
    tags: ["dipole", "superposition"],
  },
  {
    slug: "neet-phy-torque-current-loop",
    examType: "NEET",
    subject: "Physics",
    chapter: "Moving Charges and Magnetism",
    topic: "Torque on a current loop",
    type: "derivation",
    difficulty: "medium",
    content:
      "Derive the torque on a rectangular current-carrying loop placed in a uniform magnetic field, define the magnetic dipole moment, and state the conditions for maximum and zero torque.",
    correctAnswer: "τ = NIAB sin θ, or in vector form τ = m × B with m = NIA",
    solution:
      "Take a rectangular loop of sides l and b carrying current I, with N turns, in a uniform field B, and let θ be the angle between the normal to the loop and B.\nThe forces on the two sides of length b are equal, opposite and collinear, so they cancel with no net torque. The forces on the two sides of length l are F = BIl each, opposite in direction, and separated by a perpendicular distance b sin θ — a couple.\nTorque τ = F × (perpendicular distance) = BIl · b sin θ = BIA sin θ for one turn, and NIAB sin θ for N turns.\nDefining the magnetic dipole moment m = NIA (a vector along the loop's normal, by the right-hand rule), this is τ = m × B.\nTorque is maximum (NIAB) when θ = 90°, i.e. the plane of the loop contains B, and zero when θ = 0°, i.e. the loop's normal is aligned with B — the stable equilibrium orientation. This is the operating principle of the moving-coil galvanometer and the electric motor.",
    expectedMinutes: 8,
    tags: ["magnetic-moment", "galvanometer"],
  },
];
