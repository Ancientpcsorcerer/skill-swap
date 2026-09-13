import type { ConnectionRequest, Person } from './types';

// Fictional local directory. No external profiles or recommendation service are implied.
export const connectPeople: Person[] = [
  { id: 'aarav', name: 'Aarav Sharma', skills: ['Robotics', 'Computer Vision'], interests: ['Open source', 'Exploration'], projectInterests: ['Autonomous systems'], description: 'Building an autonomous rover. Looking for people who love solving things together.' },
  { id: 'ishita', name: 'Ishita Rao', skills: ['Product Design', 'User Research'], interests: ['Sustainability', 'Inclusive design'], projectInterests: ['Assistive technology'], description: 'Designing useful everyday experiences, from the first sketch to the final detail.' },
  { id: 'rohan', name: 'Rohan Kulkarni', skills: ['Embedded Systems', 'Robotics'], interests: ['Electronics', 'Open source'], projectInterests: ['Autonomous systems'], description: 'Making small machines do interesting things. Currently exploring low-cost sensors.' },
  { id: 'kavya', name: 'Kavya Nair', skills: ['Research', 'Science Communication'], interests: ['Education', 'Writing'], projectInterests: ['Community learning'], description: 'Turning complex questions into clear stories. Open to research collaborations.' },
  { id: 'meera', name: 'Meera Joshi', skills: ['Product Design', 'Materials'], interests: ['Sustainability', 'Circular design'], projectInterests: ['Sustainable products'], description: 'Exploring better ways to make things, with less waste and more care.' },
  { id: 'arjun', name: 'Arjun Das', skills: ['Mechanical Design', '3D Printing'], interests: ['Aviation', 'Prototyping'], projectInterests: ['Assistive technology'], description: 'From an idea on paper to a working prototype. Always up for a hands-on project.' },
  { id: 'nikhil', name: 'Nikhil Sen', skills: ['Software Engineering', 'Web Development'], interests: ['Open source', 'Music'], projectInterests: ['Creative tools'], description: 'Building open tools that make collaboration a little easier.' },
  { id: 'sara', name: 'Sara Khan', skills: ['Interaction Design', 'Accessibility'], interests: ['Inclusive design', 'Education'], projectInterests: ['Assistive technology'], description: 'Making digital spaces easier for everyone to use. Let us build something accessible.' },
  { id:'kabir',name:'Kabir Singh',username:'kabirs',skills:['Photography','Editing'],interests:['Art','Travel'],projectInterests:['Visual storytelling'],description:'Finding stories in everyday light. Teaching photography through practice.' },
  { id:'dev',name:'Dev Mehta',username:'devm',skills:['Mathematics','Teaching'],interests:['Education','Research'],projectInterests:['Community learning'],description:'Making mathematics approachable through puzzles and real-world questions.' },
  { id:'ananya',name:'Ananya Rao',username:'ananyar',skills:['Cooking','Nutrition'],interests:['Food','Sustainability'],projectInterests:['Community kitchens'],description:'Sharing practical cooking skills and thoughtful ways to use seasonal ingredients.' },
  { id:'leela',name:'Leela Das',username:'leelad',skills:['Music','Composition'],interests:['Art','Education'],projectInterests:['Community music'],description:'Exploring rhythm and melody. Helping new musicians find their own voice.' },
];
export const connectionRequests: ConnectionRequest[] = [
  { id: 'incoming-rohan', personId: 'rohan', direction: 'incoming', status: 'pending' },
  { id: 'incoming-sara', personId: 'sara', direction: 'incoming', status: 'pending' },
  { id: 'outgoing-nikhil', personId: 'nikhil', direction: 'outgoing', status: 'pending' },
];
