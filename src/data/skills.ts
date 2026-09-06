import type { Skill, SkillCategory } from '@/types';

export const SKILLS: Skill[] = [
  // Design
  { id: 'design.foundations', label: 'Design Foundations', category: 'design', blurb: 'Hierarchy, contrast, rhythm.' },
  { id: 'design.color', label: 'Color Theory', category: 'design' },
  { id: 'design.type', label: 'Typography', category: 'design' },
  { id: 'design.figma', label: 'Figma', category: 'design' },
  { id: 'design.brand', label: 'Brand Identity', category: 'design' },
  { id: 'design.ux', label: 'UX Research', category: 'design' },
  { id: 'design.editorial', label: 'Editorial Layout', category: 'design' },
  { id: 'design.generative', label: 'Generative Art', category: 'design' },
  { id: 'design.photo', label: 'Photography', category: 'design' },
  { id: 'design.riso', label: 'Risograph', category: 'design' },

  // Code
  { id: 'code.htmlcss', label: 'HTML & CSS', category: 'code' },
  { id: 'code.js', label: 'JavaScript', category: 'code' },
  { id: 'code.ts', label: 'TypeScript', category: 'code' },
  { id: 'code.react', label: 'React', category: 'code' },
  { id: 'code.python', label: 'Python', category: 'code' },
  { id: 'code.sql', label: 'SQL', category: 'code' },
  { id: 'code.swift', label: 'Swift', category: 'code' },
  { id: 'code.rust', label: 'Rust', category: 'code' },
  { id: 'code.a11y', label: 'Accessibility Patterns', category: 'code' },
  { id: 'code.build', label: 'Build Tools', category: 'code' },

  // Music
  { id: 'music.guitar', label: 'Guitar', category: 'music' },
  { id: 'music.piano', label: 'Piano', category: 'music' },
  { id: 'music.singing', label: 'Singing', category: 'music' },
  { id: 'music.theory', label: 'Music Theory', category: 'music' },
  { id: 'music.songwriting', label: 'Songwriting', category: 'music' },
  { id: 'music.production', label: 'Production', category: 'music' },
  { id: 'music.synth', label: 'Modular Synth', category: 'music' },
  { id: 'music.dj', label: 'DJing', category: 'music' },
  { id: 'music.charts', label: 'Reading Charts', category: 'music' },
  { id: 'music.mixing', label: 'Mixing', category: 'music' },

  // Cooking
  { id: 'cooking.sourdough', label: 'Sourdough', category: 'cooking' },
  { id: 'cooking.knife', label: 'Knife Skills', category: 'cooking' },
  { id: 'cooking.pasta', label: 'Pasta', category: 'cooking' },
  { id: 'cooking.fermentation', label: 'Fermentation', category: 'cooking' },
  { id: 'cooking.sushi', label: 'Sushi', category: 'cooking' },
  { id: 'cooking.vegan', label: 'Vegan', category: 'cooking' },
  { id: 'cooking.bread', label: 'Bread', category: 'cooking' },
  { id: 'cooking.cake', label: 'Cake Decorating', category: 'cooking' },
  { id: 'cooking.spice', label: 'Spice Blends', category: 'cooking' },
  { id: 'cooking.mealprep', label: 'Meal Prep', category: 'cooking' },

  // Language
  { id: 'lang.spanish', label: 'Spanish', category: 'language' },
  { id: 'lang.japanese', label: 'Japanese', category: 'language' },
  { id: 'lang.korean', label: 'Korean', category: 'language' },
  { id: 'lang.mandarin', label: 'Mandarin', category: 'language' },
  { id: 'lang.french', label: 'French', category: 'language' },
  { id: 'lang.arabic', label: 'Arabic', category: 'language' },
  { id: 'lang.portuguese', label: 'Portuguese', category: 'language' },
  { id: 'lang.german', label: 'German', category: 'language' },
  { id: 'lang.italian', label: 'Italian', category: 'language' },
  { id: 'lang.swahili', label: 'Swahili', category: 'language' },

  // Movement
  { id: 'move.yoga', label: 'Yoga', category: 'movement' },
  { id: 'move.pilates', label: 'Pilates', category: 'movement' },
  { id: 'move.climbing', label: 'Climbing', category: 'movement' },
  { id: 'move.strength', label: 'Strength', category: 'movement' },
  { id: 'move.running', label: 'Running Form', category: 'movement' },
  { id: 'move.mobility', label: 'Mobility', category: 'movement' },
  { id: 'move.bouldering', label: 'Bouldering', category: 'movement' },
  { id: 'move.dance', label: 'Contemporary Dance', category: 'movement' },
  { id: 'move.capoeira', label: 'Capoeira', category: 'movement' },
  { id: 'move.taichi', label: 'Tai Chi', category: 'movement' },

  // Writing
  { id: 'write.longform', label: 'Long-form', category: 'writing' },
  { id: 'write.editing', label: 'Editing', category: 'writing' },
  { id: 'write.poetry', label: 'Poetry', category: 'writing' },
  { id: 'write.screen', label: 'Screenwriting', category: 'writing' },
  { id: 'write.journal', label: 'Journaling', category: 'writing' },
  { id: 'write.docs', label: 'Technical Docs', category: 'writing' },
  { id: 'write.copy', label: 'Copy', category: 'writing' },
  { id: 'write.world', label: 'Worldbuilding', category: 'writing' },
  { id: 'write.translation', label: 'Translation', category: 'writing' },
  { id: 'write.memoir', label: 'Memoir', category: 'writing' },

  // Craft
  { id: 'craft.pottery', label: 'Pottery', category: 'craft' },
  { id: 'craft.bookbinding', label: 'Bookbinding', category: 'craft' },
  { id: 'craft.embroidery', label: 'Embroidery', category: 'craft' },
  { id: 'craft.woodwork', label: 'Woodworking', category: 'craft' },
  { id: 'craft.knitting', label: 'Knitting', category: 'craft' },
  { id: 'craft.blockprint', label: 'Block Print', category: 'craft' },
  { id: 'craft.mending', label: 'Mending', category: 'craft' },
  { id: 'craft.soap', label: 'Soapmaking', category: 'craft' },
  { id: 'craft.bead', label: 'Beadwork', category: 'craft' },
  { id: 'craft.leather', label: 'Leather', category: 'craft' },
];

export const SKILL_INDEX: Record<string, Skill> = Object.fromEntries(
  SKILLS.map((s) => [s.id, s]),
);

export const SKILLS_BY_CATEGORY: Record<SkillCategory, Skill[]> = SKILLS.reduce(
  (acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  },
  {
    design: [],
    code: [],
    music: [],
    cooking: [],
    language: [],
    movement: [],
    writing: [],
    craft: [],
  } as Record<SkillCategory, Skill[]>,
);
