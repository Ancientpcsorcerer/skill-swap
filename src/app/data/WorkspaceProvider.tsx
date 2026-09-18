import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useSession } from '../session/SessionProvider';
import { api } from '../../lib/api';
import type { Activity, LearningRecord, Project } from './models';

interface WorkspaceState {
  projects: Project[];
  learning: LearningRecord[];
  goals: string[];
  savedProjects: string[];
  savedItems: string[];
  communities: string[];
  activity: Activity[];
}

const initial: WorkspaceState = {
  projects: [],
  learning: [],
  goals: [],
  savedProjects: [],
  savedItems: [],
  communities: [],
  activity: [],
};

function mapServerProject(p: any): Project {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    vision: p.vision || '',
    type: p.type || 'Engineering',
    requiredSkills: p.required_skills || p.requiredSkills || [],
    creatorId: p.creator_id || p.creatorId || 'creator',
    collaboratorIds: p.members ? p.members.map((m: any) => m.user_id) : p.collaboratorIds || [],
    status: p.status === 'Completed' ? 'Completed' : p.status === 'Draft' ? 'Draft' : 'Ongoing',
    art: p.art || 'product',
    tags: p.tags || [p.type || 'Engineering'],
    members: (p.members?.length || 0) + 1,
    visibility: p.visibility || 'public',
    coverImageUrl: p.cover_image_url || p.coverImageUrl || undefined,
    cover_image_url: p.cover_image_url || p.coverImageUrl || undefined,
    recreated_from_id: p.recreated_from_id || null,
    is_following: Boolean(p.is_following),
    like_count: p.like_count || 0,
    has_liked: Boolean(p.has_liked),
    comment_count: p.comment_count || 0,
    repost_count: p.repost_count || 0,
    has_reposted: Boolean(p.has_reposted),
    files: p.files || [],
    imageUrls: p.image_urls || p.imageUrls || [],
    videoUrls: p.video_urls || p.videoUrls || [],
  };
}

function useWorkspaceController(userId: string) {
  const [state, setState] = useState<WorkspaceState>(initial);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const refreshProjects = useCallback(async () => {
    try {
      setLoading(true);
      const serverProjects = await api.projects.list();
      if (Array.isArray(serverProjects)) {
        const mapped = serverProjects.map(mapServerProject);
        setState((prev) => ({
          ...prev,
          projects: mapped,
        }));
      }
    } catch (err: any) {
      console.error('Failed to fetch projects from backend:', err);
      setError(err?.message || 'Could not load projects from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  function addProject(createdProject: Project | Omit<Project, 'id' | 'creatorId' | 'collaboratorIds' | 'members' | 'rating'>) {
    const project: Project = 'id' in createdProject && createdProject.id
      ? (createdProject as Project)
      : {
          ...createdProject,
          id: crypto.randomUUID(),
          creatorId: userId,
          collaboratorIds: [],
          members: 1,
        };

    setState((prev) => ({
      ...prev,
      projects: [project, ...prev.projects.filter((p) => p.id !== project.id)],
      activity: [
        {
          id: crypto.randomUUID(),
          kind: 'project',
          title: 'Created ' + project.title,
          description: project.description,
        },
        ...prev.activity,
      ],
    }));

    return project;
  }

  async function updateProject(id: string, status: Project['status']) {
    try {
      await api.projects.update(id, { status });
    } catch (err) {
      console.warn('Backend project status update failed:', err);
    }
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, status } : p)),
    }));
  }

  function setLearning(pathId: string, status: LearningRecord['status']) {
    setState((prev) => ({
      ...prev,
      learning: [
        ...prev.learning.filter((item) => item.pathId !== pathId),
        {
          pathId,
          status,
          progress: status === 'Completed' ? 100 : prev.learning.find((item) => item.pathId === pathId)?.progress ?? 0,
        },
      ],
    }));
  }

  function setGoal(goal: string) {
    if (goal.trim()) {
      setState((prev) => ({
        ...prev,
        goals: [goal.trim(), ...prev.goals.filter((item) => item !== goal.trim())],
      }));
    }
  }

  function toggle(field: 'savedProjects' | 'savedItems' | 'communities', id: string) {
    setState((prev) => ({
      ...prev,
      [field]: prev[field].includes(id) ? prev[field].filter((item) => item !== id) : [...prev[field], id],
    }));
  }

  async function joinProject(id: string) {
    try {
      await api.projects.join(id);
    } catch (err) {
      console.warn('Backend project join failed:', err);
    }
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id
          ? {
              ...p,
              collaboratorIds: Array.from(new Set([...p.collaboratorIds, userId])),
              members: p.members + 1,
            }
          : p
      ),
    }));
  }

  async function followProject(id: string) {
    try {
      await api.projects.follow(id);
    } catch (err) {
      console.warn('Backend project follow failed:', err);
    }
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, is_following: true } : p
      ),
    }));
  }

  async function unfollowProject(id: string) {
    try {
      await api.projects.unfollow(id);
    } catch (err) {
      console.warn('Backend project unfollow failed:', err);
    }
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, is_following: false } : p
      ),
    }));
  }

  async function likeProject(id: string) {
    const res = await api.projects.like(id);
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, like_count: res.likeCount, has_liked: true } : p
      ),
    }));
    return res;
  }

  async function unlikeProject(id: string) {
    const res = await api.projects.unlike(id);
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, like_count: res.likeCount, has_liked: false } : p
      ),
    }));
    return res;
  }

  async function repostProject(id: string) {
    const res = await api.projects.repost(id);
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, repost_count: res.repostCount, has_reposted: true } : p
      ),
    }));
    return res;
  }

  async function unrepostProject(id: string) {
    const res = await api.projects.unrepost(id);
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, repost_count: res.repostCount, has_reposted: false } : p
      ),
    }));
    return res;
  }

  async function deleteProject(id: string) {
    await api.projects.delete(id);
    setState((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  }

  async function updateProjectFull(id: string, data: Partial<Project>) {
    const updated = await api.projects.update(id, data);
    const mapped = mapServerProject(updated);
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, ...mapped } : p)),
    }));
    return mapped;
  }

  return {
    ...state,
    allProjects: state.projects,
    loading,
    error,
    storageError: error,
    refreshProjects,
    addProject,
    updateProject,
    updateProjectFull,
    deleteProject,
    likeProject,
    unlikeProject,
    repostProject,
    unrepostProject,
    setLearning,
    setGoal,
    toggleSavedProject: (id: string) => toggle('savedProjects', id),
    toggleSavedItem: (id: string) => toggle('savedItems', id),
    toggleCommunity: (id: string) => toggle('communities', id),
    joinProject,
    followProject,
    unfollowProject,
  };
}

const Context = createContext<ReturnType<typeof useWorkspaceController> | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session?.identity.id || 'guest';
  const value = useWorkspaceController(userId);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error('WorkspaceProvider is required');
  return value;
}
