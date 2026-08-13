import type { BankSeed } from "./types";

/**
 * JEE sheet — ordered by chapter weightage, highest-yield first within each
 * subject. Mathematics carries the largest share of the paper, followed by
 * Physics and Chemistry; inside each subject the chapters here are the ones
 * that repeatedly account for 3-5 questions apiece.
 */
export const jeeBank: BankSeed[] = [
  // ---------------------------------------------------------------- Physics
  {
    slug: "jee-phy-kinematics-range-equals-height",
    examType: "JEE_MAIN",
    subject: "Physics",
    chapter: "Kinematics",
    topic: "Projectile motion",
    type: "derivation",
    difficulty: "easy",
    content:
      "A particle is projected from level ground with speed u at an angle θ to the horizontal. Derive the condition on θ for which the horizontal range equals the maximum height attained, and find θ.",
    correctAnswer: "tan θ = 4, i.e. θ = arctan 4 ≈ 75.96°",
    solution:
      "Range R = u² sin 2θ / g and maximum height H = u² sin²θ / (2g). Setting R = H gives 2 sin θ cos θ = sin²θ / 2, so 4 cos θ = sin θ and tan θ = 4. Note the result is independent of u — a useful sanity check.",
    hint: "Write both R and H in terms of u, θ and g, then divide out the common u²/g.",
    expectedMinutes: 4,
    tags: ["projectile", "derivation"],
  },
  {
    slug: "jee-phy-laws-motion-min-horizontal-force",
    examType: "JEE_MAIN",
    subject: "Physics",
    chapter: "Laws of Motion",
    topic: "Friction on an incline",
    type: "derivation",
    difficulty: "medium",
    content:
      "A block of mass m rests on a rough incline of angle θ with coefficient of static friction μ. Find the minimum horizontal force F (directed into the incline) required to push the block up the slope.",
    correctAnswer: "F = mg (sin θ + μ cos θ) / (cos θ − μ sin θ)",
    solution:
      "Resolve along and perpendicular to the incline. Perpendicular: N = mg cos θ + F sin θ. Along (block on the verge of moving up, so friction acts down the slope): F cos θ = mg sin θ + μN. Substituting N and solving for F gives the quoted result. The denominator vanishing at tan θ = 1/μ tells you no horizontal force can push it up beyond that angle.",
    hint: "The horizontal force has a component pressing the block into the incline, so it increases the normal reaction — and therefore the friction opposing you.",
    expectedMinutes: 6,
    tags: ["friction", "free-body-diagram"],
  },
  {
    slug: "jee-phy-work-energy-hanging-chain",
    examType: "JEE_MAIN",
    subject: "Physics",
    chapter: "Work, Energy and Power",
    topic: "Work done against gravity",
    type: "numeric",
    difficulty: "medium",
    content:
      "A uniform chain of mass M and length L lies on a frictionless table with one-third of its length hanging over the edge. Calculate the work required to pull the hanging part back onto the table.",
    correctAnswer: "W = MgL/18",
    solution:
      "The hanging portion has mass M/3 and length L/3, so its centre of mass sits L/6 below the table top. Pulling it up raises that centre of mass by L/6, so W = (M/3)·g·(L/6) = MgL/18. The table being frictionless means no other work is needed.",
    hint: "Track the centre of mass of the hanging segment, not the end of the chain.",
    expectedMinutes: 4,
    tags: ["centre-of-mass", "gravitational-PE"],
  },
  {
    slug: "jee-phy-rotation-rolling-cylinder-incline",
    examType: "JEE_MAIN",
    subject: "Physics",
    chapter: "Rotational Motion",
    topic: "Rolling without slipping",
    type: "derivation",
    difficulty: "medium",
    content:
      "A solid cylinder rolls without slipping down an incline of angle θ. Derive its linear acceleration and the minimum coefficient of friction needed to sustain rolling.",
    correctAnswer: "a = (2/3) g sin θ; μ_min = (tan θ)/3",
    solution:
      "For a body rolling without slipping, a = g sin θ / (1 + k²/R²). A solid cylinder has I = MR²/2, so k²/R² = 1/2 and a = (2/3) g sin θ. The friction required is f = Ma·(k²/R²)/(1)… more directly, f = Mg sin θ − Ma = Mg sin θ/3, and with N = Mg cos θ, μ_min = f/N = tan θ / 3.",
    hint: "Use the standard rolling result a = g sin θ / (1 + k²/R²), then get friction from Newton's second law along the incline.",
    expectedMinutes: 6,
    tags: ["moment-of-inertia", "rolling"],
  },
  {
    slug: "jee-phy-gravitation-escape-velocity-density",
    examType: "JEE_MAIN",
    subject: "Physics",
    chapter: "Gravitation",
    topic: "Escape velocity",
    type: "derivation",
    difficulty: "easy",
    content:
      "Express the escape velocity from the surface of a planet of uniform density ρ and radius R in terms of ρ, R and G. Hence state how escape velocity scales with radius for planets of equal density.",
    correctAnswer: "v = R √(8πGρ/3); v ∝ R at fixed density",
    solution:
      "v = √(2GM/R) with M = (4/3)πR³ρ. Substituting, v = √(8πGρR²/3) = R√(8πGρ/3). So at fixed density escape velocity grows linearly with radius.",
    expectedMinutes: 3,
    tags: ["escape-velocity"],
  },
  {
    slug: "jee-phy-shm-mass-added-at-equilibrium",
    examType: "JEE_MAIN",
    subject: "Physics",
    chapter: "Oscillations",
    topic: "Vertical spring-mass SHM",
    type: "short_answer",
    difficulty: "hard",
    content:
      "A mass m hangs at rest from a vertical spring of stiffness k. A second mass m is then gently attached to it (released from rest at that position). Find the amplitude and angular frequency of the resulting oscillation.",
    correctAnswer: "Amplitude A = mg/k; angular frequency ω = √(k/2m)",
    solution:
      "Before: equilibrium extension is mg/k. After attaching the second mass the new equilibrium extension is 2mg/k, i.e. the equilibrium point moves down by mg/k. The system starts at rest at the *old* equilibrium, which is therefore an extreme of the new motion, so A = mg/k. The oscillating mass is now 2m, giving ω = √(k/2m).",
    hint: "'Gently attached' means the initial velocity is zero — so the starting point must be a turning point of the new SHM.",
    expectedMinutes: 5,
    tags: ["SHM", "equilibrium-shift"],
  },
  {
    slug: "jee-phy-waves-organ-pipe-ratio",
    examType: "JEE_MAIN",
    subject: "Physics",
    chapter: "Waves",
    topic: "Organ pipes",
    type: "short_answer",
    difficulty: "medium",
    content:
      "The third harmonic of a closed organ pipe has the same frequency as the first overtone of an open organ pipe. Find the ratio of their lengths (closed : open).",
    correctAnswer: "L_closed : L_open = 3 : 4",
    solution:
      "A closed pipe supports only odd harmonics; its third harmonic is f = 3v/(4L_c). An open pipe's first overtone is its second harmonic, f = 2v/(2L_o) = v/L_o. Equating: 3v/(4L_c) = v/L_o, so L_o = 4L_c/3 and L_c : L_o = 3 : 4.",
    hint: "'First overtone' of an open pipe is the second harmonic, not the third.",
    expectedMinutes: 4,
    tags: ["standing-waves", "harmonics"],
  },
  {
    slug: "jee-phy-thermo-polytropic-pv2",
    examType: "JEE_MAIN",
    subject: "Physics",
    chapter: "Thermodynamics and Kinetic Theory",
    topic: "Polytropic process",
    type: "long_answer",
    difficulty: "hard",
    content:
      "One mole of an ideal monatomic gas at temperature T expands from volume V to 2V along the process PV² = constant. Find the work done by the gas, the change in internal energy, and the heat absorbed.",
    correctAnswer: "W = RT/2, ΔU = −3RT/4, Q = −RT/4 (heat is released)",
    solution:
      "With P = C/V², W = ∫ᵥ²ᵛ C V⁻² dV = C(1/V − 1/2V) = C/(2V). Since C = P₁V₁², W = P₁V₁/2 = RT/2.\nFor the temperature: PV = RT and PV² = C give TV = C/R = constant, so doubling the volume halves the temperature: T₂ = T/2.\nΔU = (3/2)R(T₂ − T₁) = −3RT/4. By the first law Q = ΔU + W = −3RT/4 + RT/2 = −RT/4, so the gas releases heat even while expanding.",
    hint: "Combine PV = RT with PV² = constant to see how T varies with V before touching the first law.",
    expectedMinutes: 8,
    tags: ["first-law", "polytropic"],
  },
  {
    slug: "jee-phy-electrostatics-uniform-sphere-field",
    examType: "JEE_MAIN",
    subject: "Physics",
    chapter: "Electrostatics",
    topic: "Gauss's law",
    type: "derivation",
    difficulty: "medium",
    content:
      "A non-conducting sphere of radius R carries total charge Q distributed uniformly through its volume. Using Gauss's law, derive E(r) both inside and outside, and sketch E against r.",
    correctAnswer:
      "E = Qr/(4πε₀R³) for r < R; E = Q/(4πε₀r²) for r > R; peak at r = R",
    solution:
      "Take a concentric spherical Gaussian surface. For r > R the enclosed charge is Q, giving E = Q/(4πε₀r²) — identical to a point charge. For r < R the enclosed charge is Q(r³/R³), so E·4πr² = Qr³/(ε₀R³) and E = Qr/(4πε₀R³), linear in r. The two expressions agree at r = R, which is the maximum.",
    expectedMinutes: 6,
    tags: ["gauss-law", "graph"],
  },
  {
    slug: "jee-phy-current-metre-bridge-shift",
    examType: "JEE_MAIN",
    subject: "Physics",
    chapter: "Current Electricity",
    topic: "Metre bridge",
    type: "numeric",
    difficulty: "medium",
    content:
      "In a metre bridge the null point is found at 40 cm from the left end. When a 10 Ω resistance is connected in series with the resistance in the left gap, the null point shifts to 50 cm. Find both resistances.",
    correctAnswer: "Left-gap resistance R = 20 Ω, right-gap resistance S = 30 Ω",
    solution:
      "Balance gives R/S = l/(100 − l). Initially R/S = 40/60 = 2/3. After adding 10 Ω in series: (R + 10)/S = 50/50 = 1, so S = R + 10. Substituting R = 2S/3 gives S = 2S/3 + 10, hence S = 30 Ω and R = 20 Ω.",
    hint: "Two balance conditions, two unknowns — write both before substituting.",
    expectedMinutes: 5,
    tags: ["wheatstone", "metre-bridge"],
  },
  {
    slug: "jee-phy-emi-rod-on-rails",
    examType: "JEE_MAIN",
    subject: "Physics",
    chapter: "Electromagnetic Induction",
    topic: "Motional EMF",
    type: "derivation",
    difficulty: "medium",
    content:
      "A conducting rod of length l slides at constant velocity v on frictionless rails of negligible resistance, closed by a resistor R, in a uniform field B perpendicular to the plane of the rails. Derive the induced emf, the current, the external force needed to maintain v, and the power dissipated. Verify energy conservation.",
    correctAnswer: "ε = Blv, I = Blv/R, F = B²l²v/R, P = B²l²v²/R",
    solution:
      "Motional emf ε = Blv drives I = Blv/R. The current-carrying rod experiences a retarding force BIl = B²l²v/R, so an equal applied force is needed for constant velocity. Mechanical power delivered is Fv = B²l²v²/R, exactly matching I²R = B²l²v²/R — all the work done goes into Joule heating.",
    expectedMinutes: 6,
    tags: ["motional-emf", "energy-conservation"],
  },
  {
    slug: "jee-phy-modern-photoelectric-two-wavelengths",
    examType: "JEE_MAIN",
    subject: "Physics",
    chapter: "Modern Physics",
    topic: "Photoelectric effect",
    type: "numeric",
    difficulty: "medium",
    content:
      "In a photoelectric experiment the stopping potential is 1.42 V for light of wavelength 400 nm and 0.80 V for 500 nm. Determine Planck's constant and the work function of the emitter. (Take c = 3 × 10⁸ m/s, e = 1.6 × 10⁻¹⁹ C.)",
    correctAnswer: "h ≈ 6.6 × 10⁻³⁴ J·s; work function φ ≈ 1.68 eV",
    solution:
      "Einstein's equation gives eV₀ = hc/λ − φ. Subtracting the two cases eliminates φ:\ne(V₁ − V₂) = hc(1/λ₁ − 1/λ₂).\n1/λ₁ − 1/λ₂ = 2.5×10⁶ − 2.0×10⁶ = 5×10⁵ m⁻¹, and V₁ − V₂ = 0.62 V.\nSo hc = (1.6×10⁻¹⁹ × 0.62)/(5×10⁵) = 1.984×10⁻²⁵ J·m and h = 1.984×10⁻²⁵/3×10⁸ ≈ 6.6×10⁻³⁴ J·s.\nUsing hc = 1240 eV·nm, the 400 nm photon carries 3.10 eV, so φ = 3.10 − 1.42 = 1.68 eV. Check against the second data point: 2.48 − 1.68 = 0.80 V. ✓",
    hint: "Subtract the two equations first — the work function drops out and h falls straight out.",
    expectedMinutes: 7,
    tags: ["photoelectric", "two-point-data"],
  },

  // -------------------------------------------------------------- Chemistry
  {
    slug: "jee-chem-mole-empirical-formula-combustion",
    examType: "JEE_MAIN",
    subject: "Chemistry",
    chapter: "Some Basic Concepts of Chemistry",
    topic: "Empirical formula",
    type: "numeric",
    difficulty: "easy",
    content:
      "A 2.00 g sample of a hydrocarbon on complete combustion gives 6.16 g of CO₂ and 2.52 g of H₂O. Determine its empirical formula, showing the mass balance check.",
    correctAnswer: "CH₂",
    solution:
      "n(CO₂) = 6.16/44 = 0.14 mol → 0.14 mol C = 1.68 g.\nn(H₂O) = 2.52/18 = 0.14 mol → 0.28 mol H = 0.28 g.\nMass check: 1.68 + 0.28 = 1.96 g ≈ 2.00 g, confirming only C and H are present.\nC : H = 0.14 : 0.28 = 1 : 2, so the empirical formula is CH₂.",
    hint: "Each mole of H₂O contains two moles of hydrogen atoms.",
    expectedMinutes: 4,
    tags: ["stoichiometry", "combustion-analysis"],
  },
  {
    slug: "jee-chem-atomic-bohr-li2plus",
    examType: "JEE_MAIN",
    subject: "Chemistry",
    chapter: "Atomic Structure",
    topic: "Bohr model",
    type: "numeric",
    difficulty: "easy",
    content:
      "Calculate the radius and the energy of the third Bohr orbit of Li²⁺. Comment on why this energy equals that of the ground state of hydrogen.",
    correctAnswer: "r₃ = 1.587 Å; E₃ = −13.6 eV",
    solution:
      "r_n = 0.529 (n²/Z) Å = 0.529 × 9/3 = 1.587 Å.\nE_n = −13.6 (Z²/n²) eV = −13.6 × 9/9 = −13.6 eV.\nThe coincidence is because n/Z = 1 for both cases (n = 1, Z = 1 for H and n = 3, Z = 3 here), and E depends only on Z²/n².",
    expectedMinutes: 3,
    tags: ["bohr-model", "hydrogen-like"],
  },
  {
    slug: "jee-chem-bonding-bond-angle-trend",
    examType: "JEE_MAIN",
    subject: "Chemistry",
    chapter: "Chemical Bonding",
    topic: "VSEPR",
    type: "short_answer",
    difficulty: "easy",
    content:
      "Account for the bond angle trend CH₄ (109.5°) > NH₃ (107°) > H₂O (104.5°), even though all three central atoms are sp³ hybridised.",
    correctAnswer:
      "Increasing number of lone pairs; lp–lp > lp–bp > bp–bp repulsion compresses the bond angle.",
    solution:
      "All three are sp³ with four electron domains. CH₄ has four bond pairs and keeps the ideal tetrahedral angle. NH₃ has one lone pair, and lone-pair–bond-pair repulsion exceeds bond-pair–bond-pair repulsion, squeezing the H–N–H angle to 107°. H₂O has two lone pairs, adding strong lone-pair–lone-pair repulsion, compressing further to 104.5°.",
    expectedMinutes: 3,
    tags: ["VSEPR", "theory"],
  },
  {
    slug: "jee-chem-thermo-haber-spontaneity",
    examType: "JEE_MAIN",
    subject: "Chemistry",
    chapter: "Thermodynamics",
    topic: "Gibbs free energy",
    type: "numeric",
    difficulty: "medium",
    content:
      "For N₂(g) + 3H₂(g) → 2NH₃(g), ΔH° = −92.4 kJ mol⁻¹ and ΔS° = −198.3 J K⁻¹ mol⁻¹ at 298 K. Calculate ΔG° at 298 K and the temperature above which the reaction becomes non-spontaneous.",
    correctAnswer: "ΔG° ≈ −33.3 kJ mol⁻¹; non-spontaneous above ≈ 466 K",
    solution:
      "ΔG° = ΔH° − TΔS° = −92.4 − 298(−0.1983) = −92.4 + 59.1 = −33.3 kJ mol⁻¹, so the reaction is spontaneous at 298 K.\nSpontaneity is lost when ΔG° = 0, i.e. T = ΔH°/ΔS° = 92 400/198.3 ≈ 466 K. This is exactly the industrial tension in the Haber process: higher temperature speeds the rate but destroys the equilibrium yield.",
    hint: "Convert ΔS° to kJ before combining — the classic unit slip here.",
    expectedMinutes: 5,
    tags: ["gibbs-energy", "haber-process"],
  },
  {
    slug: "jee-chem-equilibrium-pcl5-kc",
    examType: "JEE_MAIN",
    subject: "Chemistry",
    chapter: "Chemical Equilibrium",
    topic: "Kc from degree of dissociation",
    type: "numeric",
    difficulty: "medium",
    content:
      "0.10 mol of PCl₅ is heated in a 2.0 L closed vessel. At equilibrium it is 40% dissociated into PCl₃ and Cl₂. Calculate Kc.",
    correctAnswer: "Kc ≈ 1.33 × 10⁻² mol L⁻¹",
    solution:
      "PCl₅ ⇌ PCl₃ + Cl₂. Dissociated amount = 0.40 × 0.10 = 0.04 mol.\nAt equilibrium (moles): PCl₅ 0.06, PCl₃ 0.04, Cl₂ 0.04. Dividing by 2.0 L: 0.03, 0.02, 0.02 M.\nKc = (0.02 × 0.02)/0.03 = 1.33 × 10⁻² mol L⁻¹.",
    hint: "Convert moles to molarity before substituting — Kc for this reaction is not dimensionless.",
    expectedMinutes: 5,
    tags: ["Kc", "degree-of-dissociation"],
  },
  {
    slug: "jee-chem-ionic-acetic-buffer-ph",
    examType: "JEE_MAIN",
    subject: "Chemistry",
    chapter: "Ionic Equilibrium",
    topic: "Buffers",
    type: "numeric",
    difficulty: "medium",
    content:
      "Calculate the pH of 0.10 M acetic acid (Ka = 1.8 × 10⁻⁵). Then calculate the pH after mixing it with an equal volume of 0.10 M sodium acetate, and explain the size of the change.",
    correctAnswer: "pH ≈ 2.87 before; pH = pKa ≈ 4.74 after",
    solution:
      "Weak acid alone: [H⁺] = √(Ka·C) = √(1.8×10⁻⁶) = 1.34×10⁻³ M, so pH = 2.87.\nAfter mixing equal volumes, both acid and salt are 0.05 M — equal concentrations. By Henderson–Hasselbalch, pH = pKa + log([salt]/[acid]) = pKa + log 1 = pKa = 4.74.\nThe ~1.9 unit jump is the common-ion effect: added acetate suppresses the acid's dissociation.",
    expectedMinutes: 6,
    tags: ["buffer", "henderson-hasselbalch", "common-ion"],
  },
  {
    slug: "jee-chem-electrochem-nernst-daniell",
    examType: "JEE_MAIN",
    subject: "Chemistry",
    chapter: "Electrochemistry",
    topic: "Nernst equation",
    type: "numeric",
    difficulty: "medium",
    content:
      "For the cell Zn | Zn²⁺ (0.10 M) || Cu²⁺ (0.010 M) | Cu, E°cell = 1.10 V. Calculate Ecell at 298 K and state whether the reaction is still spontaneous.",
    correctAnswer: "Ecell ≈ 1.07 V; still spontaneous",
    solution:
      "Cell reaction: Zn + Cu²⁺ → Zn²⁺ + Cu, n = 2, Q = [Zn²⁺]/[Cu²⁺] = 0.10/0.010 = 10.\nEcell = E° − (0.0591/n) log Q = 1.10 − (0.0591/2)(1) = 1.10 − 0.0296 ≈ 1.07 V.\nEcell > 0, so ΔG < 0 and the reaction remains spontaneous — the unfavourable concentration ratio costs only ~30 mV.",
    hint: "Q uses only the dissolved species; solids don't appear.",
    expectedMinutes: 5,
    tags: ["nernst", "galvanic-cell"],
  },
  {
    slug: "jee-chem-kinetics-first-order-30-percent",
    examType: "JEE_MAIN",
    subject: "Chemistry",
    chapter: "Chemical Kinetics",
    topic: "First-order kinetics",
    type: "numeric",
    difficulty: "medium",
    content:
      "A first-order reaction is 30% complete in 40 minutes. Calculate the rate constant and the time required for 90% completion.",
    correctAnswer: "k ≈ 8.92 × 10⁻³ min⁻¹; t₉₀ ≈ 258 min",
    solution:
      "k = (2.303/t) log(a/(a−x)) = (2.303/40) log(100/70) = (2.303/40)(0.1549) = 8.92×10⁻³ min⁻¹.\nFor 90% completion, a/(a−x) = 100/10 = 10, so t = (2.303/k) log 10 = 2.303/8.92×10⁻³ ≈ 258 min.",
    hint: "For first order the time for a given *fraction* is independent of initial concentration.",
    expectedMinutes: 5,
    tags: ["rate-constant", "half-life"],
  },
  {
    slug: "jee-chem-periodic-ionisation-anomalies",
    examType: "JEE_MAIN",
    subject: "Chemistry",
    chapter: "Classification of Elements and Periodicity",
    topic: "Ionisation enthalpy",
    type: "short_answer",
    difficulty: "medium",
    content:
      "Ionisation enthalpy generally increases across a period, yet IE₁(Be) > IE₁(B) and IE₁(N) > IE₁(O). Explain both anomalies.",
    correctAnswer:
      "Be: removing from a filled 2s vs a higher-energy 2p in B. N: half-filled 2p³ stability vs paired-electron repulsion in O's 2p⁴.",
    solution:
      "Be (1s²2s²) loses an electron from a completely filled, penetrating 2s orbital, whereas B (…2s²2p¹) loses a 2p electron that is higher in energy and better shielded — so B is easier to ionise.\nN (…2p³) has a half-filled p subshell with all spins parallel, which is extra-stable (exchange energy). O (…2p⁴) must place two electrons in one 2p orbital; the resulting inter-electronic repulsion makes the fourth electron easier to remove despite the larger nuclear charge.",
    expectedMinutes: 4,
    tags: ["periodicity", "theory"],
  },
  {
    slug: "jee-chem-coordination-cr-complexes",
    examType: "JEE_MAIN",
    subject: "Chemistry",
    chapter: "Coordination Compounds",
    topic: "Crystal field theory",
    type: "long_answer",
    difficulty: "medium",
    content:
      "For [Cr(NH₃)₆]³⁺ and [CrF₆]³⁻, state the oxidation state, d-electron count, hybridisation, geometry and spin-only magnetic moment. Both are paramagnetic to the same extent — so explain why they differ in colour.",
    correctAnswer:
      "Cr(III), d³, d²sp³ octahedral, μ = √15 ≈ 3.87 BM for both; colours differ because NH₃ is a stronger-field ligand and gives a larger Δo.",
    solution:
      "Cr is +3 in both, so d³. In an octahedral field the three electrons occupy t2g singly regardless of ligand strength, so both are inner-orbital d²sp³ octahedral with three unpaired electrons: μ = √(3×5) = 3.87 BM. Magnetism therefore cannot distinguish them.\nColour can. In the spectrochemical series NH₃ lies well above F⁻, so Δo is larger for the ammine complex; it absorbs shorter-wavelength (higher-energy) light and appears yellow-orange, while [CrF₆]³⁻ with small Δo absorbs at longer wavelength and appears green.",
    hint: "d³ has no high-spin/low-spin distinction in an octahedral field — look to Δo and the spectrochemical series instead.",
    expectedMinutes: 7,
    tags: ["CFT", "spectrochemical-series"],
  },
  {
    slug: "jee-chem-goc-acidity-order",
    examType: "JEE_MAIN",
    subject: "Chemistry",
    chapter: "General Organic Chemistry",
    topic: "Acidity and electronic effects",
    type: "short_answer",
    difficulty: "medium",
    content:
      "Arrange in increasing order of acidity, with reasoning: ethanol, p-cresol, phenol, p-nitrophenol, acetic acid.",
    correctAnswer:
      "ethanol < p-cresol < phenol < p-nitrophenol < acetic acid",
    solution:
      "Ethanol's alkoxide has no delocalisation, so it is the weakest. Phenoxide is resonance-stabilised over the ring, making phenol far more acidic. p-Cresol's methyl group is electron-donating (+I, hyperconjugation), destabilising the anion, so it sits just below phenol. The p-nitro group is strongly electron-withdrawing (−I and −M) and delocalises the negative charge onto oxygen, so p-nitrophenol is more acidic than phenol. Acetic acid tops the list: its carboxylate spreads the charge equally over two electronegative oxygens.",
    expectedMinutes: 5,
    tags: ["acidity", "resonance", "inductive-effect"],
  },
  {
    slug: "jee-chem-organic-conversion-benzene-benzoyl-chloride",
    examType: "JEE_MAIN",
    subject: "Chemistry",
    chapter: "Aldehydes, Ketones and Carboxylic Acids",
    topic: "Reaction sequences",
    type: "short_answer",
    difficulty: "medium",
    content:
      "Identify A, B and C and name each step: benzene —(CH₃COCl / anhyd. AlCl₃)→ A —(I₂ / NaOH, then H₃O⁺)→ B —(SOCl₂)→ C.",
    correctAnswer:
      "A = acetophenone, B = benzoic acid, C = benzoyl chloride",
    solution:
      "Step 1 is a Friedel–Crafts acylation giving acetophenone (C₆H₅COCH₃).\nStep 2 is the iodoform (haloform) reaction: the methyl ketone is cleaved to sodium benzoate plus iodoform (CHI₃, yellow precipitate); acidification gives benzoic acid.\nStep 3 converts the acid to the acid chloride with thionyl chloride — the preferred reagent because both by-products (SO₂, HCl) are gases and escape, driving the reaction and leaving a pure product.",
    hint: "Any methyl ketone answers the iodoform test — that is what step 2 exploits.",
    expectedMinutes: 5,
    tags: ["friedel-crafts", "haloform", "named-reactions"],
  },

  // ----------------------------------------------------------- Mathematics
  {
    slug: "jee-math-quadratic-alpha6-beta6",
    examType: "JEE_MAIN",
    subject: "Mathematics",
    chapter: "Complex Numbers and Quadratic Equations",
    topic: "Roots and De Moivre",
    type: "numeric",
    difficulty: "medium",
    content:
      "If α and β are the roots of x² − 2x + 4 = 0, find α⁶ + β⁶. Generalise to α? + β? for arbitrary n.",
    correctAnswer: "α⁶ + β⁶ = 128; in general αⁿ + βⁿ = 2ⁿ⁺¹ cos(nπ/3)",
    solution:
      "The roots are 1 ± i√3, i.e. modulus 2 and argument ±π/3: α = 2e^{iπ/3}, β = 2e^{−iπ/3}.\nBy De Moivre, αⁿ + βⁿ = 2ⁿ(e^{inπ/3} + e^{−inπ/3}) = 2ⁿ⁺¹ cos(nπ/3).\nFor n = 6: 2⁷ cos 2π = 128 × 1 = 128.",
    hint: "Convert the roots to polar form rather than grinding out powers algebraically.",
    expectedMinutes: 5,
    tags: ["de-moivre", "polar-form"],
  },
  {
    slug: "jee-math-series-sum-reciprocals",
    examType: "JEE_MAIN",
    subject: "Mathematics",
    chapter: "Sequences and Series",
    topic: "nth term from partial sums",
    type: "long_answer",
    difficulty: "medium",
    content:
      "The sum of the first n terms of a series is Sₙ = n(n+1)(n+2)/6. Find the nth term, and hence evaluate Σ(n = 1 to ∞) 1/tₙ.",
    correctAnswer: "tₙ = n(n+1)/2; the sum of reciprocals is 2",
    solution:
      "tₙ = Sₙ − Sₙ₋₁ = [n(n+1)(n+2) − (n−1)n(n+1)]/6 = n(n+1)[(n+2) − (n−1)]/6 = n(n+1)/2 — the triangular numbers.\nThen 1/tₙ = 2/(n(n+1)) = 2(1/n − 1/(n+1)), which telescopes: the partial sum to N is 2(1 − 1/(N+1)) → 2 as N → ∞.",
    hint: "After finding tₙ, split 1/tₙ into partial fractions and look for a telescoping pattern.",
    expectedMinutes: 6,
    tags: ["telescoping", "partial-fractions"],
  },
  {
    slug: "jee-math-complex-locus-arg-half-pi",
    examType: "JEE_MAIN",
    subject: "Mathematics",
    chapter: "Complex Numbers and Quadratic Equations",
    topic: "Loci in the Argand plane",
    type: "short_answer",
    difficulty: "hard",
    content:
      "Find and describe the locus of z satisfying arg((z − 1)/(z + 1)) = π/2.",
    correctAnswer:
      "The upper half of the unit circle x² + y² = 1 (y > 0), excluding z = ±1",
    solution:
      "arg((z−1)/(z+1)) = π/2 means the vector from 1 to z is perpendicular to the vector from −1 to z, so z sees the segment joining −1 and 1 at a right angle. By the converse of the angle-in-a-semicircle theorem, z lies on the circle with that segment as diameter: |z| = 1.\nThe argument is +π/2 rather than −π/2, which fixes the orientation and selects only the upper arc, y > 0. The endpoints ±1 are excluded since the expression is undefined there.",
    hint: "An argument of π/2 is a statement about perpendicularity — think geometrically before expanding into x and y.",
    expectedMinutes: 7,
    tags: ["argand-plane", "locus"],
  },
  {
    slug: "jee-math-determinants-infinite-solutions",
    examType: "JEE_MAIN",
    subject: "Mathematics",
    chapter: "Matrices and Determinants",
    topic: "Consistency of linear systems",
    type: "numeric",
    difficulty: "medium",
    content:
      "For what values of λ does the system x + y + z = 1, x + 2y + 4z = λ, x + 4y + 10z = λ² have infinitely many solutions?",
    correctAnswer: "λ = 1 or λ = 2",
    solution:
      "The coefficient determinant is |1 1 1; 1 2 4; 1 4 10| = 1(20−16) − 1(10−4) + 1(4−2) = 0 for every λ, so the system is never uniquely solvable — it is either inconsistent or has infinitely many solutions.\nRow-reduce: R₂ − R₁ gives y + 3z = λ − 1; R₃ − R₁ gives 3y + 9z = λ² − 1, i.e. 3(y + 3z) = λ² − 1.\nConsistency requires 3(λ − 1) = λ² − 1, so λ² − 3λ + 2 = 0 and λ = 1 or 2.",
    hint: "A zero determinant only rules out a *unique* solution; you still need the consistency condition.",
    expectedMinutes: 6,
    tags: ["rank", "consistency"],
  },
  {
    slug: "jee-math-binomial-term-independent",
    examType: "JEE_MAIN",
    subject: "Mathematics",
    chapter: "Binomial Theorem",
    topic: "General term",
    type: "numeric",
    difficulty: "easy",
    content: "Find the term independent of x in the expansion of (√x − 2/x²)¹⁰.",
    correctAnswer: "180",
    solution:
      "General term: T_{r+1} = ¹⁰C_r (√x)^{10−r} (−2/x²)^r = ¹⁰C_r (−2)^r x^{(10−r)/2 − 2r}.\nSetting the exponent to zero: (10 − r)/2 = 2r ⟹ 10 − r = 4r ⟹ r = 2.\nT₃ = ¹⁰C₂ (−2)² = 45 × 4 = 180.",
    expectedMinutes: 4,
    tags: ["general-term"],
  },
  {
    slug: "jee-math-circle-concentric-tangent",
    examType: "JEE_MAIN",
    subject: "Mathematics",
    chapter: "Circles",
    topic: "Tangency conditions",
    type: "short_answer",
    difficulty: "easy",
    content:
      "Find the equation of the circle concentric with x² + y² − 2x + 4y − 20 = 0 that touches the line 4x + 3y = 10.",
    correctAnswer: "(x − 1)² + (y + 2)² = 144/25",
    solution:
      "The given circle has centre (1, −2) (from −g, −f with 2g = −2, 2f = 4). Concentric means the same centre.\nTouching the line means the radius equals the perpendicular distance from the centre to it:\nr = |4(1) + 3(−2) − 10| / √(4² + 3²) = |−12|/5 = 12/5.\nHence (x − 1)² + (y + 2)² = 144/25.",
    expectedMinutes: 4,
    tags: ["perpendicular-distance", "tangent"],
  },
  {
    slug: "jee-math-hyperbola-eccentricity-foci",
    examType: "JEE_MAIN",
    subject: "Mathematics",
    chapter: "Conic Sections",
    topic: "Hyperbola",
    type: "short_answer",
    difficulty: "easy",
    content:
      "For 9x² − 16y² = 144, find the eccentricity, the coordinates of the foci, and the equations of the directrices.",
    correctAnswer: "e = 5/4; foci (±5, 0); directrices x = ±16/5",
    solution:
      "Divide by 144: x²/16 − y²/9 = 1, so a = 4, b = 3.\nFor a hyperbola b² = a²(e² − 1): 9 = 16(e² − 1) ⟹ e² = 25/16 ⟹ e = 5/4.\nFoci at (±ae, 0) = (±5, 0). Directrices at x = ±a/e = ±16/5.",
    expectedMinutes: 4,
    tags: ["hyperbola", "eccentricity"],
  },
  {
    slug: "jee-math-limit-tanx-minus-sinx",
    examType: "JEE_MAIN",
    subject: "Mathematics",
    chapter: "Limits, Continuity and Differentiability",
    topic: "Standard limits",
    type: "numeric",
    difficulty: "easy",
    content:
      "Evaluate lim(x→0) (tan x − sin x)/x³ without using L'Hôpital's rule.",
    correctAnswer: "1/2",
    solution:
      "tan x − sin x = sin x (1/cos x − 1) = sin x (1 − cos x)/cos x.\nSo the expression is (sin x / x) · ((1 − cos x)/x²) · (1/cos x).\nAs x → 0 these tend to 1, 1/2 and 1 respectively, giving 1/2.",
    hint: "Factor sin x out first; you are then left with two standard limits.",
    expectedMinutes: 4,
    tags: ["standard-limits"],
  },
  {
    slug: "jee-math-aod-window-optimisation",
    examType: "JEE_MAIN",
    subject: "Mathematics",
    chapter: "Application of Derivatives",
    topic: "Maxima and minima",
    type: "long_answer",
    difficulty: "medium",
    content:
      "A window is in the shape of a rectangle surmounted by a semicircle whose diameter is the rectangle's width. If the total perimeter is 10 m, find the dimensions that admit the most light, and comment on the relationship you find between them.",
    correctAnswer:
      "Radius r = height h = 10/(4 + π) ≈ 1.40 m, so the width is 2r ≈ 2.80 m",
    solution:
      "Let the semicircle have radius r, so the rectangle is 2r wide and h tall.\nPerimeter: 2r + 2h + πr = 10 ⟹ h = (10 − 2r − πr)/2.\nArea: A = 2rh + πr²/2 = 10r − 2r² − πr²/2.\ndA/dr = 10 − 4r − πr = 0 ⟹ r = 10/(4 + π) ≈ 1.40 m.\nd²A/dr² = −(4 + π) < 0, confirming a maximum.\nSubstituting back gives h = 10/(4 + π) = r: the rectangle's height equals the semicircle's radius, so the window is exactly half as tall (in its rectangular part) as it is wide.",
    hint: "The curved boundary contributes πr to the perimeter, not 2πr — only half the circle is there.",
    expectedMinutes: 8,
    tags: ["optimisation", "second-derivative-test"],
  },
  {
    slug: "jee-math-definite-integral-ln-sin",
    examType: "JEE_ADVANCED",
    subject: "Mathematics",
    chapter: "Integral Calculus",
    topic: "Definite integral properties",
    type: "derivation",
    difficulty: "hard",
    content:
      "Evaluate I = ∫₀^{π/2} ln(sin x) dx using the king property and the double-angle identity.",
    correctAnswer: "I = −(π/2) ln 2",
    solution:
      "By the king property ∫₀^a f(x)dx = ∫₀^a f(a−x)dx, I is also ∫₀^{π/2} ln(cos x) dx.\nAdding: 2I = ∫₀^{π/2} ln(sin x cos x) dx = ∫₀^{π/2} ln((sin 2x)/2) dx = ∫₀^{π/2} ln(sin 2x) dx − (π/2) ln 2.\nSubstituting t = 2x in the first integral: (1/2)∫₀^{π} ln(sin t) dt = (1/2)(2I) = I, using the symmetry of sin about π/2.\nSo 2I = I − (π/2) ln 2, giving I = −(π/2) ln 2. The negative sign is expected since sin x ≤ 1 on the interval.",
    hint: "Add I to its 'king property' twin so the product sin x·cos x appears, then use sin 2x = 2 sin x cos x.",
    expectedMinutes: 10,
    tags: ["king-property", "classic"],
  },
  {
    slug: "jee-math-3d-shortest-distance-skew",
    examType: "JEE_MAIN",
    subject: "Mathematics",
    chapter: "Vector Algebra and 3D Geometry",
    topic: "Skew lines",
    type: "numeric",
    difficulty: "medium",
    content:
      "Find the shortest distance between the lines r = (i + 2j + 3k) + λ(2i + 3j + 4k) and r = (2i + 4j + 5k) + μ(3i + 4j + 5k).",
    correctAnswer: "1/√6",
    solution:
      "d₁ × d₂ = (2,3,4) × (3,4,5) = (3·5 − 4·4, 4·3 − 2·5, 2·4 − 3·3) = (−1, 2, −1), with magnitude √6.\na₂ − a₁ = (1, 2, 2).\nShortest distance = |(a₂ − a₁)·(d₁ × d₂)| / |d₁ × d₂| = |−1 + 4 − 2|/√6 = 1/√6.\nThe non-zero result confirms the lines are genuinely skew.",
    hint: "If the scalar triple product had come out zero the lines would be coplanar, and this formula would not apply.",
    expectedMinutes: 6,
    tags: ["cross-product", "scalar-triple-product"],
  },
  {
    slug: "jee-math-probability-conditional-both-red",
    examType: "JEE_MAIN",
    subject: "Mathematics",
    chapter: "Probability",
    topic: "Conditional probability",
    type: "numeric",
    difficulty: "medium",
    content:
      "A bag holds 5 red and 4 blue balls. Two are drawn together at random. Given that at least one of them is red, find the probability that both are red.",
    correctAnswer: "1/3",
    solution:
      "Total ways: ⁹C₂ = 36.\nP(both red) = ⁵C₂/36 = 10/36.\nP(at least one red) = 1 − P(both blue) = 1 − ⁴C₂/36 = 1 − 6/36 = 30/36.\nP(both red | at least one red) = (10/36)/(30/36) = 1/3.\nNote this differs from the unconditional 10/36 — conditioning on 'at least one' is not the same as fixing one specific ball as red.",
    hint: "Compute the conditioning event through its complement (both blue); it is much faster.",
    expectedMinutes: 5,
    tags: ["conditional-probability", "combinations"],
  },
];
