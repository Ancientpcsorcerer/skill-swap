import type { Community, ExplorationItem, LearningPath, Project } from './models';
export const projectTypes = ['Technology','Design','Hardware','Research','Social Impact','Education','Art','Environment','Other'];
export const projectTemplates = [
  { title:'Tech Project', type:'Technology', description:'Build software, apps or tools', icon:'template' },
  { title:'Design Project', type:'Design', description:'Create visual experiences and products', icon:'pencil' },
  { title:'Hardware Project', type:'Hardware', description:'Work on electronics, robotics or DIY', icon:'gear' },
  { title:'Social Impact', type:'Social Impact', description:'Solve real problems together', icon:'connect' },
  { title:'Research Project', type:'Research', description:'Explore, analyse and innovate', icon:'bulb' },
] as const;
export const suggestedRoles = ['Developer','Designer','Researcher','Hardware','Writer','Data Analyst','Mentor','Student'];
export const sampleProjects: Project[] = [
  { id:'uav',title:'Autonomous Fixed-Wing UAV',description:'Building an open-source fixed-wing autopilot with INAV, GPS and FPV.',vision:'Make autonomous flight more accessible.',type:'Hardware',requiredSkills:['Robotics','Electronics'],creatorId:'example-aarav',collaboratorIds:['rohan','arjun'],status:'Ongoing',art:'drone',tags:['Aerospace','Robotics','Open Source'],members:6,rating:4.8,files:[] },
  { id:'world',title:'World Monitor',description:'Real-time global events visualization using satellite, OSINT and live data.',vision:'Help communities understand a changing world.',type:'Technology',requiredSkills:['Data Visualization','Web Development'],creatorId:'example-nikhil',collaboratorIds:['nikhil','kavya'],status:'Ongoing',art:'world',tags:['Data','Visualization','Geopolitics'],members:8,rating:4.6,files:[] },
  { id:'urban',title:'Sustainable Urban Design',description:'Exploring low-cost, eco-friendly solutions for smarter cities.',vision:'Create healthier places to live.',type:'Environment',requiredSkills:['Product Design','Research'],creatorId:'example-meera',collaboratorIds:['meera','ishita'],status:'Ongoing',art:'urban',tags:['Design','Environment','Urbanism'],members:5,rating:4.7,files:[] },
  { id:'balidan',title:'Balidan - Interactive Experience',description:'A cinematic web experience exploring the stories behind independence.',vision:'Make history a shared experience.',type:'Art',requiredSkills:['Writing','Storytelling'],creatorId:'example-kavya',collaboratorIds:['kavya','sara'],status:'Draft',art:'balidan',tags:['History','Storytelling','Web'],members:7,rating:4.9,files:[] },
  { id:'satellite',title:'Low Cost Satellite Tracker',description:'Tracking LEO satellites with open hardware.',vision:'Bring space exploration to the classroom.',type:'Hardware',requiredSkills:['Electronics'],creatorId:'example-arjun',collaboratorIds:['arjun'],status:'Ongoing',art:'satellite',tags:['Aerospace','Hardware','DIY'],members:8,files:[] },
  { id:'open-learning',title:'Open Source Learning Hub',description:'A curated collection of free resources for self-learners.',vision:'Make learning available to everyone.',type:'Education',requiredSkills:['Teaching','Writing'],creatorId:'example-nikhil',collaboratorIds:['nikhil','kavya'],status:'Ongoing',art:'code',tags:['Education','Open Source','Tools'],members:4,files:[] },
  { id:'rural',title:'Learning for Rural Communities',description:'Practical learning experiences for students in rural areas.',vision:'Support education through community knowledge.',type:'Social Impact',requiredSkills:['Education','Research'],creatorId:'example-kavya',collaboratorIds:['kavya'],status:'Ongoing',art:'microscope',tags:['Education','Social Impact'],members:12,files:[] },
  { id:'ocean',title:'Ocean Cleanup Initiative',description:'Collaborative solutions for cleaner oceans and healthier marine life.',vision:'Protect the ecosystems we all share.',type:'Environment',requiredSkills:['Research','Robotics'],creatorId:'example-meera',collaboratorIds:['meera','aarav'],status:'Ongoing',art:'ocean',tags:['Environment','Robotics','Impact'],members:9,files:[] },
];
export const learningCategories = ['Programming','Design','Robotics','Electronics','Photography','Business','Writing','Mathematics','Cooking','Music','Research'];
export const learningPaths: LearningPath[] = [
  { id:'robotics',title:'Python for Robotics',description:'Sensors, kinematics, ROS and control systems with Python',category:'Robotics',topics:['robotics','python','electronics'],art:'drone',mentorIds:['aarav','rohan'],resources:42 },
  { id:'web',title:'Web Development',description:'From basics to real projects',category:'Programming',topics:['coding','software','javascript','web'],art:'code',mentorIds:['nikhil'],resources:48 },
  { id:'ai',title:'AI & Machine Learning',description:'Learn, build and apply',category:'Programming',topics:['mathematics','data','machine learning'],art:'ai',mentorIds:['aarav'],resources:72 },
  { id:'drone',title:'Drone & UAV Systems',description:'Hardware, software and flight',category:'Robotics',topics:['robotics','electronics','aerospace'],art:'drone',mentorIds:['rohan','arjun','aarav'],resources:36 },
  { id:'design',title:'Product Design',description:'Turn ideas into real products',category:'Design',topics:['design','research','prototyping'],art:'product',mentorIds:['ishita','meera'],resources:40 },
  { id:'writing',title:'Research & Writing',description:'Learn to analyse and write',category:'Writing',topics:['writing','research','communication'],art:'books',mentorIds:['kavya'],resources:52 },
  { id:'photo',title:'Photography Foundations',description:'Learn to see light and tell stories',category:'Photography',topics:['photography','camera','editing'],art:'urban',mentorIds:['kabir'],resources:24 },
  { id:'math',title:'Mathematics in Everyday Life',description:'Build confidence with numbers',category:'Mathematics',topics:['mathematics','maths','algebra'],art:'product',mentorIds:['dev'],resources:32 },
  { id:'cooking',title:'Cooking with Confidence',description:'Build a repertoire of everyday meals',category:'Cooking',topics:['cooking','food','nutrition'],art:'books',mentorIds:['ananya'],resources:18 },
  { id:'music',title:'A Practical Guide to Music',description:'Explore rhythm, melody and composition',category:'Music',topics:['music','guitar','composition'],art:'ai',mentorIds:['leela'],resources:28 },
  { id:'business',title:'Build a Thoughtful Business',description:'From an idea to a sustainable practice',category:'Business',topics:['business','marketing','strategy'],art:'urban',mentorIds:['ishita'],resources:20 },
];
export const communities: Community[] = [
  { id:'builders',name:'Builders Collective',description:'A place for curious people who make things.',category:'Technology',members:'2.4K',art:'ai' },
  { id:'aerospace',name:'Aerospace & UAV',description:'Share ideas about flight and open hardware.',category:'Hardware',members:'1.8K',art:'satellite' },
  { id:'creative',name:'Design & Creativity',description:'Explore better ways to think, design and create.',category:'Design',members:'3.1K',art:'urban' },
];
export const trendingTopics = ['AI for Social Good','Drone Technology','Sustainable Living','Open Source Tools','Student Innovation'];
export const trendingSkills = ['Robotics','Photography','Web Development','Product Design','Writing'];
export const explorationItems: ExplorationItem[] = [
  { id:'repair',kind:'Ideas',title:'A neighbourhood repair library',description:'Share tools and practical knowledge to keep useful things in use.',tags:['Environment','Community','Design'],art:'product' },
  { id:'stories',kind:'Ideas',title:'Stories from our streets',description:'A collaborative photography and writing project about everyday life.',tags:['Photography','Writing','Art'],art:'urban' },
  { id:'build-day',kind:'Events',title:'Community Build Day',description:'Plan a day of making, sharing and learning with fellow builders.',tags:['Hardware','Design','Community'],art:'drone' },
  { id:'creative-circle',kind:'Events',title:'The Creative Exchange',description:'An open invitation to exchange ideas about music, art and storytelling.',tags:['Music','Art','Writing'],art:'books' },
];
