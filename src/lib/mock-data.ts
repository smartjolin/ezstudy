export interface StudySet {
  id: string;
  title: string;
  subject: string;
  description: string;
  materialCount: number;
  flashcardCount: number;
  quizCount: number;
  noteCount: number;
  mastery: number;
  lastStudied: string;
  createdAt: string;
  color: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastery: number;
  setId: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type?: "MULTIPLE_CHOICE" | "FILL_IN_BLANK" | "SHORT_ANSWER";
  options: string[];
  correctIndex: number;
  correctAnswer?: string;
  explanation: string;
  hint?: string;
  setId: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  setId: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export const studySets: StudySet[] = [
  {
    id: "bio-101",
    title: "Biology 101",
    subject: "Biology",
    description: "Introduction to cellular biology, genetics, and evolution",
    materialCount: 5,
    flashcardCount: 48,
    quizCount: 12,
    noteCount: 8,
    mastery: 85,
    lastStudied: "2 hours ago",
    createdAt: "2024-01-15",
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "calc-2",
    title: "Calculus II",
    subject: "Mathematics",
    description: "Integration techniques, sequences, and series",
    materialCount: 3,
    flashcardCount: 36,
    quizCount: 8,
    noteCount: 6,
    mastery: 72,
    lastStudied: "1 day ago",
    createdAt: "2024-01-20",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "psych-200",
    title: "Psychology 200",
    subject: "Psychology",
    description: "Cognitive psychology, memory, and learning theories",
    materialCount: 7,
    flashcardCount: 64,
    quizCount: 15,
    noteCount: 10,
    mastery: 91,
    lastStudied: "5 hours ago",
    createdAt: "2024-02-01",
    color: "from-purple-500 to-violet-600",
  },
  {
    id: "hist-101",
    title: "World History",
    subject: "History",
    description: "Major world events from ancient civilizations to modern era",
    materialCount: 4,
    flashcardCount: 52,
    quizCount: 10,
    noteCount: 12,
    mastery: 65,
    lastStudied: "3 days ago",
    createdAt: "2024-02-10",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "chem-101",
    title: "Chemistry 101",
    subject: "Chemistry",
    description: "Atomic structure, chemical bonding, and reactions",
    materialCount: 6,
    flashcardCount: 40,
    quizCount: 9,
    noteCount: 7,
    mastery: 78,
    lastStudied: "1 day ago",
    createdAt: "2024-02-15",
    color: "from-red-500 to-rose-600",
  },
  {
    id: "cs-101",
    title: "Intro to Computer Science",
    subject: "Computer Science",
    description: "Algorithms, data structures, and programming fundamentals",
    materialCount: 8,
    flashcardCount: 55,
    quizCount: 14,
    noteCount: 9,
    mastery: 88,
    lastStudied: "4 hours ago",
    createdAt: "2024-02-20",
    color: "from-cyan-500 to-teal-600",
  },
];

export const flashcards: Record<string, Flashcard[]> = {
  "bio-101": [
    { id: "f1", front: "What is the powerhouse of the cell?", back: "The mitochondria is the organelle responsible for producing ATP (adenosine triphosphate), the cell's main energy currency, through cellular respiration.", mastery: 95, setId: "bio-101" },
    { id: "f2", front: "What is DNA?", back: "Deoxyribonucleic acid (DNA) is a molecule composed of two polynucleotide chains that coil around each other to form a double helix. It carries genetic instructions for the development and function of all living organisms.", mastery: 88, setId: "bio-101" },
    { id: "f3", front: "What is photosynthesis?", back: "Photosynthesis is the process by which green plants and some organisms convert light energy, water, and carbon dioxide into glucose and oxygen. The equation is: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂", mastery: 75, setId: "bio-101" },
    { id: "f4", front: "What is mitosis?", back: "Mitosis is a type of cell division resulting in two daughter cells each having the same number and kind of chromosomes as the parent cell. It consists of prophase, metaphase, anaphase, and telophase.", mastery: 82, setId: "bio-101" },
    { id: "f5", front: "What is natural selection?", back: "Natural selection is the process where organisms with favorable traits are more likely to survive and reproduce. It is a key mechanism of evolution described by Charles Darwin.", mastery: 70, setId: "bio-101" },
    { id: "f6", front: "What are the four nucleotide bases in DNA?", back: "Adenine (A), Thymine (T), Guanine (G), and Cytosine (C). A pairs with T, and G pairs with C through hydrogen bonds.", mastery: 92, setId: "bio-101" },
  ],
};

export const quizQuestions: Record<string, QuizQuestion[]> = {
  "bio-101": [
    {
      id: "q1",
      question: "Which organelle is responsible for producing energy in the cell?",
      options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"],
      correctIndex: 1,
      explanation: "The mitochondria produces ATP through cellular respiration, making it the primary energy-producing organelle.",
      setId: "bio-101",
    },
    {
      id: "q2",
      question: "What is the shape of a DNA molecule?",
      options: ["Single helix", "Double helix", "Triple helix", "Linear chain"],
      correctIndex: 1,
      explanation: "DNA has a double helix structure, first described by Watson and Crick in 1953.",
      setId: "bio-101",
    },
    {
      id: "q3",
      question: "Which base pairs with Adenine in DNA?",
      options: ["Guanine", "Cytosine", "Thymine", "Uracil"],
      correctIndex: 2,
      explanation: "In DNA, Adenine (A) always pairs with Thymine (T) through two hydrogen bonds.",
      setId: "bio-101",
    },
    {
      id: "q4",
      question: "What is the product of photosynthesis?",
      options: ["Carbon dioxide and water", "Glucose and oxygen", "ATP and NADPH", "Proteins and lipids"],
      correctIndex: 1,
      explanation: "Photosynthesis converts CO₂ and H₂O into glucose (C₆H₁₂O₆) and oxygen (O₂) using light energy.",
      setId: "bio-101",
    },
    {
      id: "q5",
      question: "How many phases does mitosis have?",
      options: ["2", "3", "4", "5"],
      correctIndex: 2,
      explanation: "Mitosis has 4 phases: prophase, metaphase, anaphase, and telophase.",
      setId: "bio-101",
    },
  ],
};

export const notes: Record<string, Note[]> = {
  "bio-101": [
    {
      id: "n1",
      title: "Cell Structure & Function",
      content: `## Cell Structure & Function

### Overview
All living organisms are composed of cells — the basic unit of life. Cells can be classified as **prokaryotic** (no nucleus) or **eukaryotic** (has a nucleus).

### Key Organelles
- **Nucleus**: Contains DNA, controls cell activities
- **Mitochondria**: Produces ATP through cellular respiration
- **Endoplasmic Reticulum (ER)**: Rough ER has ribosomes (protein synthesis), Smooth ER (lipid synthesis)
- **Golgi Apparatus**: Modifies, packages, and ships proteins
- **Cell Membrane**: Phospholipid bilayer, controls what enters/exits
- **Ribosomes**: Sites of protein synthesis

### Cell Theory
1. All living things are composed of cells
2. Cells are the basic unit of structure and function
3. All cells come from pre-existing cells`,
      setId: "bio-101",
      createdAt: "2024-01-15",
    },
    {
      id: "n2",
      title: "DNA & Genetics",
      content: `## DNA & Genetics

### DNA Structure
DNA is a double helix made of nucleotides, each containing:
- A phosphate group
- A deoxyribose sugar
- A nitrogenous base (A, T, G, C)

### Base Pairing Rules
- Adenine (A) pairs with Thymine (T)
- Guanine (G) pairs with Cytosine (C)

### DNA Replication
1. Helicase unwinds the double helix
2. Primase adds RNA primers
3. DNA polymerase adds complementary nucleotides
4. Ligase seals the fragments

### Gene Expression
DNA → mRNA (transcription) → Protein (translation)`,
      setId: "bio-101",
      createdAt: "2024-01-17",
    },
  ],
};

export function getStudySet(id: string): StudySet | undefined {
  return studySets.find((s) => s.id === id);
}

export function getFlashcards(setId: string): Flashcard[] {
  return flashcards[setId] || flashcards["bio-101"];
}

export function getQuizQuestions(setId: string): QuizQuestion[] {
  return quizQuestions[setId] || quizQuestions["bio-101"];
}

export function getNotes(setId: string): Note[] {
  return notes[setId] || notes["bio-101"];
}
