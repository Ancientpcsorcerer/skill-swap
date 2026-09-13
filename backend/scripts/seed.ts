import { pool, withTransaction } from '../src/db/client';
import { hashPassword } from '../src/utils/tokens';

async function seed() {
  console.log('🌱 Starting Skill Swap database seed...');

  const defaultPasswordHash = await hashPassword('Password123!');

  await withTransaction(async (client) => {
    // 1. Seed Users & Credentials
    const samplePeople = [
      { id: 'aarav', name: 'Aarav Sharma', username: 'aarav', email: 'aarav@example.com', skills: ['Robotics', 'Computer Vision'], interests: ['Open source', 'Exploration'], projectInterests: ['Autonomous systems'], bio: 'Building an autonomous rover. Looking for people who love solving things together.', location: 'Bengaluru, India' },
      { id: 'ishita', name: 'Ishita Rao', username: 'ishita', email: 'ishita@example.com', skills: ['Product Design', 'User Research'], interests: ['Sustainability', 'Inclusive design'], projectInterests: ['Assistive technology'], bio: 'Designing useful everyday experiences, from the first sketch to the final detail.', location: 'Mumbai, India' },
      { id: 'rohan', name: 'Rohan Kulkarni', username: 'rohan', email: 'rohan@example.com', skills: ['Embedded Systems', 'Robotics'], interests: ['Electronics', 'Open source'], projectInterests: ['Autonomous systems'], bio: 'Making small machines do interesting things. Currently exploring low-cost sensors.', location: 'Pune, India' },
      { id: 'kavya', name: 'Kavya Nair', username: 'kavya', email: 'kavya@example.com', skills: ['Research', 'Science Communication'], interests: ['Education', 'Writing'], projectInterests: ['Community learning'], bio: 'Turning complex questions into clear stories. Open to research collaborations.', location: 'Kochi, India' },
      { id: 'meera', name: 'Meera Joshi', username: 'meera', email: 'meera@example.com', skills: ['Product Design', 'Materials'], interests: ['Sustainability', 'Circular design'], projectInterests: ['Sustainable products'], bio: 'Exploring better ways to make things, with less waste and more care.', location: 'Ahmedabad, India' },
      { id: 'arjun', name: 'Arjun Das', username: 'arjun', email: 'arjun@example.com', skills: ['Mechanical Design', '3D Printing'], interests: ['Aviation', 'Prototyping'], projectInterests: ['Assistive technology'], bio: 'From an idea on paper to a working prototype. Always up for a hands-on project.', location: 'Delhi, India' },
      { id: 'nikhil', name: 'Nikhil Sen', username: 'nikhil', email: 'nikhil@example.com', skills: ['Software Engineering', 'Web Development'], interests: ['Open source', 'Music'], projectInterests: ['Creative tools'], bio: 'Building open tools that make collaboration a little easier.', location: 'Kolkata, India' },
      { id: 'sara', name: 'Sara Khan', username: 'sara', email: 'sara@example.com', skills: ['Interaction Design', 'Accessibility'], interests: ['Inclusive design', 'Education'], projectInterests: ['Assistive technology'], bio: 'Making digital spaces easier for everyone to use. Let us build something accessible.', location: 'Hyderabad, India' },
      { id: 'kabir', name: 'Kabir Singh', username: 'kabirs', email: 'kabir@example.com', skills: ['Photography', 'Editing'], interests: ['Art', 'Travel'], projectInterests: ['Visual storytelling'], bio: 'Finding stories in everyday light. Teaching photography through practice.', location: 'Jaipur, India' },
      { id: 'dev', name: 'Dev Mehta', username: 'devm', email: 'dev@example.com', skills: ['Mathematics', 'Teaching'], interests: ['Education', 'Research'], projectInterests: ['Community learning'], bio: 'Making mathematics approachable through puzzles and real-world questions.', location: 'Chennai, India' },
      { id: 'ananya', name: 'Ananya Rao', username: 'ananyar', email: 'ananya@example.com', skills: ['Cooking', 'Nutrition'], interests: ['Food', 'Sustainability'], projectInterests: ['Community kitchens'], bio: 'Sharing practical cooking skills and thoughtful ways to use seasonal ingredients.', location: 'Mysuru, India' },
      { id: 'leela', name: 'Leela Das', username: 'leelad', email: 'leela@example.com', skills: ['Music', 'Composition'], interests: ['Art', 'Education'], projectInterests: ['Community music'], bio: 'Exploring rhythm and melody. Helping new musicians find their own voice.', location: 'Shillong, India' },
    ];

    const userIdMap = new Map<string, string>();

    for (const p of samplePeople) {
      const userRes = await client.query<{ id: string }>(
        `INSERT INTO users (name, username, email, bio, location)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (username) DO UPDATE SET name = EXCLUDED.name, bio = EXCLUDED.bio, location = EXCLUDED.location
         RETURNING id`,
        [p.name, p.username, p.email, p.bio, p.location]
      );
      const userId = userRes.rows[0].id;
      userIdMap.set(p.id, userId);
      userIdMap.set(p.username, userId);

      await client.query(
        `INSERT INTO credentials (user_id, password_hash)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [userId, defaultPasswordHash]
      );

      // Skills
      for (const skill of p.skills) {
        await client.query(
          `INSERT INTO user_skills (user_id, skill) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userId, skill]
        );
      }

      // Interests
      for (const interest of p.interests) {
        await client.query(
          `INSERT INTO user_interests (user_id, interest) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userId, interest]
        );
      }

      // Project Interests
      for (const pi of p.projectInterests) {
        await client.query(
          `INSERT INTO user_project_interests (user_id, topic) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userId, pi]
        );
      }
    }

    console.log(`✅ Seeded ${samplePeople.length} users with credentials and profile tags.`);

    // 2. Seed Communities
    const sampleCommunities = [
      { name: 'Builders Collective', description: 'A place for curious people who make things.', category: 'Technology', members: 2400, art: 'ai' },
      { name: 'Aerospace & UAV', description: 'Share ideas about flight and open hardware.', category: 'Hardware', members: 1800, art: 'satellite' },
      { name: 'Design & Creativity', description: 'Explore better ways to think, design and create.', category: 'Design', members: 3100, art: 'urban' },
    ];

    for (const c of sampleCommunities) {
      await client.query(
        `INSERT INTO communities (name, description, category, member_count, art)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, member_count = EXCLUDED.member_count, art = EXCLUDED.art`,
        [c.name, c.description, c.category, c.members, c.art]
      );
    }
    console.log(`✅ Seeded ${sampleCommunities.length} communities.`);

    // 3. Seed Ideas & Events
    const sampleIdeas = [
      { title: 'A neighbourhood repair library', description: 'Share tools and practical knowledge to keep useful things in use.', tags: ['Environment', 'Community', 'Design'], art: 'product' },
      { title: 'Stories from our streets', description: 'A collaborative photography and writing project about everyday life.', tags: ['Photography', 'Writing', 'Art'], art: 'urban' },
    ];

    for (const idea of sampleIdeas) {
      await client.query(
        `INSERT INTO ideas (title, description, tags, art)
         VALUES ($1, $2, $3, $4)`,
        [idea.title, idea.description, idea.tags, idea.art]
      );
    }

    const sampleEvents = [
      { title: 'Community Build Day', description: 'Plan a day of making, sharing and learning with fellow builders.', tags: ['Hardware', 'Design', 'Community'], art: 'drone', location: 'Maker Space & Online', is_online: true },
      { title: 'The Creative Exchange', description: 'An open invitation to exchange ideas about music, art and storytelling.', tags: ['Music', 'Art', 'Writing'], art: 'books', location: 'Online', is_online: true },
    ];

    for (const ev of sampleEvents) {
      await client.query(
        `INSERT INTO events (title, description, tags, art, location, is_online)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [ev.title, ev.description, ev.tags, ev.art, ev.location, ev.is_online]
      );
    }
    console.log(`✅ Seeded sample ideas and events.`);

    // 4. Seed Projects
    const sampleProjects = [
      { title: 'Autonomous Fixed-Wing UAV', description: 'Building an open-source fixed-wing autopilot with INAV, GPS and FPV.', vision: 'Make autonomous flight more accessible.', type: 'Hardware', requiredSkills: ['Robotics', 'Electronics'], creatorKey: 'aarav', status: 'Ongoing', art: 'drone', tags: ['Aerospace', 'Robotics', 'Open Source'] },
      { title: 'World Monitor', description: 'Real-time global events visualization using satellite, OSINT and live data.', vision: 'Help communities understand a changing world.', type: 'Technology', requiredSkills: ['Data Visualization', 'Web Development'], creatorKey: 'nikhil', status: 'Ongoing', art: 'world', tags: ['Data', 'Visualization', 'Geopolitics'] },
      { title: 'Sustainable Urban Design', description: 'Exploring low-cost, eco-friendly solutions for smarter cities.', vision: 'Create healthier places to live.', type: 'Environment', requiredSkills: ['Product Design', 'Research'], creatorKey: 'meera', status: 'Ongoing', art: 'urban', tags: ['Design', 'Environment', 'Urbanism'] },
      { title: 'Balidan - Interactive Experience', description: 'A cinematic web experience exploring the stories behind independence.', vision: 'Make history a shared experience.', type: 'Art', requiredSkills: ['Writing', 'Storytelling'], creatorKey: 'kavya', status: 'Draft', art: 'balidan', tags: ['History', 'Storytelling', 'Web'] },
      { title: 'Low Cost Satellite Tracker', description: 'Tracking LEO satellites with open hardware.', vision: 'Bring space exploration to the classroom.', type: 'Hardware', requiredSkills: ['Electronics'], creatorKey: 'arjun', status: 'Ongoing', art: 'satellite', tags: ['Aerospace', 'Hardware', 'DIY'] },
      { title: 'Open Source Learning Hub', description: 'A curated collection of free resources for self-learners.', vision: 'Make learning available to everyone.', type: 'Education', requiredSkills: ['Teaching', 'Writing'], creatorKey: 'nikhil', status: 'Ongoing', art: 'code', tags: ['Education', 'Open Source', 'Tools'] },
    ];

    for (const proj of sampleProjects) {
      const creatorId = userIdMap.get(proj.creatorKey) || userIdMap.get('aarav')!;

      const pRes = await client.query<{ id: string }>(
        `INSERT INTO projects (creator_id, title, description, vision, type, status, art, is_discoverable)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         RETURNING id`,
        [creatorId, proj.title, proj.description, proj.vision, proj.type, proj.status, proj.art]
      );
      const projectId = pRes.rows[0].id;

      for (const tag of proj.tags) {
        await client.query(
          `INSERT INTO project_tags (project_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [projectId, tag]
        );
      }

      for (const skill of proj.requiredSkills) {
        await client.query(
          `INSERT INTO project_required_skills (project_id, skill) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [projectId, skill]
        );
      }

      await client.query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, 'owner')
         ON CONFLICT (project_id, user_id) DO NOTHING`,
        [projectId, creatorId]
      );
    }
    console.log(`✅ Seeded ${sampleProjects.length} projects with tags and skills.`);
  });

  console.log('🎉 Seed complete! Default password for all seeded users is: Password123!');
}

seed()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Seed error:', err);
    await pool.end();
    process.exit(1);
  });
