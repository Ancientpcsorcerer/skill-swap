-- PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(80) NOT NULL,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(200) NOT NULL UNIQUE,
    bio TEXT NOT NULL DEFAULT '',
    location VARCHAR(100) NOT NULL DEFAULT '',
    avatar_url TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- 2. Credentials
CREATE TABLE IF NOT EXISTS credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Refresh Tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    user_agent TEXT NULL,
    ip_address INET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. User Skills
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_skill UNIQUE (user_id, skill)
);

-- 5. User Interests
CREATE TABLE IF NOT EXISTS user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_interest UNIQUE (user_id, interest)
);

-- 6. User Project Interests
CREATE TABLE IF NOT EXISTS user_project_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_project_interest UNIQUE (user_id, topic)
);

-- 7. Connections
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_connection_pair UNIQUE (requester_id, addressee_id),
    CONSTRAINT chk_no_self_connection CHECK (requester_id <> addressee_id)
);

-- 8. Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    vision TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Ongoing' CHECK (status IN ('Draft', 'Ongoing', 'Completed')),
    art VARCHAR(50) NOT NULL DEFAULT 'product',
    is_discoverable BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- 9. Project Tags
CREATE TABLE IF NOT EXISTS project_tags (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tag VARCHAR(80) NOT NULL,
    PRIMARY KEY (project_id, tag)
);

-- 10. Project Required Skills
CREATE TABLE IF NOT EXISTS project_required_skills (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill VARCHAR(80) NOT NULL,
    PRIMARY KEY (project_id, skill)
);

-- 11. Project Members
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('owner', 'collaborator', 'invited')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
);

-- 12. Project Files
CREATE TABLE IF NOT EXISTS project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    original_name VARCHAR(255) NOT NULL,
    storage_key TEXT NOT NULL UNIQUE,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Learning Records
CREATE TABLE IF NOT EXISTS learning_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    path_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('In Progress', 'Saved', 'Completed')),
    progress SMALLINT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_learning_path UNIQUE (user_id, path_id)
);

-- 14. Learning Goals
CREATE TABLE IF NOT EXISTS learning_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal VARCHAR(160) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Saved Items
CREATE TABLE IF NOT EXISTS saved_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('project', 'idea', 'event')),
    item_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_saved_item UNIQUE (user_id, item_type, item_id)
);

-- 16. Communities
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    art VARCHAR(50) NOT NULL,
    member_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Community Memberships
CREATE TABLE IF NOT EXISTS community_memberships (
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (community_id, user_id)
);

-- 18. Ideas
CREATE TABLE IF NOT EXISTS ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    art VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    art VARCHAR(50) NOT NULL,
    event_date TIMESTAMPTZ NULL,
    location VARCHAR(200) NULL,
    is_online BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Activity
CREATE TABLE IF NOT EXISTS activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind VARCHAR(30) NOT NULL CHECK (kind IN ('project', 'learning', 'profile', 'connection')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    reference_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ALTER existing tables for new columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'public';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image_url TEXT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS recreated_from_id UUID NULL REFERENCES projects(id) ON DELETE SET NULL;

-- 21. Project Followers
CREATE TABLE IF NOT EXISTS project_followers (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- 22. Project Authorized Connections (for private projects)
CREATE TABLE IF NOT EXISTS project_authorized_connections (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- 23. Project Updates
CREATE TABLE IF NOT EXISTS project_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    body TEXT NOT NULL,
    image_urls TEXT[] NOT NULL DEFAULT '{}',
    video_urls TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. Posts
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    project_tag VARCHAR(100) NULL,
    art VARCHAR(50) NOT NULL DEFAULT 'idea',
    image_urls TEXT[] NOT NULL DEFAULT '{}',
    video_urls TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. Chat Conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_one_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_two_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_participant_order CHECK (participant_one_id < participant_two_id),
    CONSTRAINT uq_conversation_pair UNIQUE (participant_one_id, participant_two_id)
);

-- 26. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ciphertext TEXT NOT NULL,
    iv VARCHAR(64) NOT NULL,
    auth_tag VARCHAR(64) NOT NULL,
    ratchet_header JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 27. Crypto Public Key Directory (E2EE)
CREATE TABLE IF NOT EXISTS user_crypto_keys (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    identity_public_key TEXT NOT NULL,
    signed_prekey TEXT NOT NULL,
    signed_prekey_signature TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_one_time_prekeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_id VARCHAR(64) NOT NULL,
    public_key TEXT NOT NULL,
    consumed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_otk UNIQUE (user_id, key_id)
);

-- 28. Media Assets & Private Gate
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT false,
    project_id UUID NULL REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 29. Media Uploads
CREATE TABLE IF NOT EXISTS media_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    storage_path TEXT NULL,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT false,
    project_id UUID NULL REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist if table was already created in earlier migration
ALTER TABLE media_uploads ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE media_uploads ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE media_uploads ADD COLUMN IF NOT EXISTS project_id UUID NULL REFERENCES projects(id) ON DELETE SET NULL;

-- Indexes for performance and search
CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING GIN (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_trgm ON user_skills USING GIN (skill gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_projects_fts ON projects USING GIN (to_tsvector('english', title || ' ' || description || ' ' || type));
CREATE INDEX IF NOT EXISTS idx_activity_user_created ON activity (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connections_users ON connections (requester_id, addressee_id, status);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_project_updates_project ON project_updates (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages (conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_conv_participants ON chat_conversations (participant_one_id, participant_two_id);

-- 30. Reposts (First-Class Backend Reposts with Provenance)
CREATE TABLE IF NOT EXISTS reposts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_post_repost UNIQUE (user_id, original_post_id)
);
CREATE INDEX IF NOT EXISTS idx_reposts_post ON reposts (original_post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_user ON reposts (user_id, created_at DESC);

-- 31. Teaching Profiles
CREATE TABLE IF NOT EXISTS teaching_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(150) NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    hourly_rate VARCHAR(50) NOT NULL DEFAULT '',
    status VARCHAR(30) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'paused')),
    availability_slots JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 32. Teaching Skills
CREATE TABLE IF NOT EXISTS teaching_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill VARCHAR(80) NOT NULL,
    level VARCHAR(30) NOT NULL DEFAULT 'expert',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_teaching_skill UNIQUE (user_id, skill)
);
CREATE INDEX IF NOT EXISTS idx_teaching_skills_skill ON teaching_skills (skill);

-- 33. Teaching Requests
CREATE TABLE IF NOT EXISTS teaching_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill VARCHAR(80) NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_no_self_teaching CHECK (student_id <> teacher_id)
);
CREATE INDEX IF NOT EXISTS idx_teaching_requests_teacher ON teaching_requests (teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_teaching_requests_student ON teaching_requests (student_id, status);

-- 34. Classes
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    skill VARCHAR(80) NOT NULL,
    schedule VARCHAR(100) NOT NULL DEFAULT '',
    meeting_url TEXT NULL,
    max_students INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes (teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_skill ON classes (skill);

-- 35. Class Members
CREATE TABLE IF NOT EXISTS class_members (
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (class_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_class_members_student ON class_members (student_id);

-- 36. Class Sessions
CREATE TABLE IF NOT EXISTS class_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    track_id VARCHAR(50) NULL,
    title VARCHAR(150) NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    meeting_url TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_class_sessions_teacher ON class_sessions (teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_class ON class_sessions (class_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_track ON class_sessions (track_id);

-- 37. Chat Group Support & Membership
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'class_group'));
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS class_id UUID NULL REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE chat_conversations ALTER COLUMN participant_one_id DROP NOT NULL;
ALTER TABLE chat_conversations ALTER COLUMN participant_two_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS chat_group_members (
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_user ON chat_group_members (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_conversations_class ON chat_conversations (class_id) WHERE class_id IS NOT NULL;

-- 38. User Zoom Integrations
CREATE TABLE IF NOT EXISTS user_zoom_integrations (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    zoom_user_id VARCHAR(100) NULL,
    zoom_email VARCHAR(255) NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    scope TEXT NULL,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 39. Session Enhancements for Zoom & Rescheduling
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS meeting_provider VARCHAR(50) NOT NULL DEFAULT 'zoom';
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS meeting_id VARCHAR(100) NULL;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS meeting_password VARCHAR(100) NULL;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) NOT NULL DEFAULT 'UTC';
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS teacher_info TEXT NULL;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
