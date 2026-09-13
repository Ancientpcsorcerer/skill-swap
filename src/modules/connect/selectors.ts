import type { ProfileIdentity } from '../../app/session/SessionProvider';
import type { ConnectionRequest, Person } from './types';
const normalize = (value: string) => value.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
export function matchesPerson(person: Person, query: string) {
  const searchable = normalize([person.name, ...person.skills, ...person.interests, ...person.projectInterests, person.description].join(' '));
  return normalize(query).trim().split(/\s+/).filter(Boolean).every(token => searchable.includes(token));
}
export function suggestPeople(people: readonly Person[], identity: ProfileIdentity) {
  return people.map(person => {
    const sharedSkill = person.skills.find(skill => identity.skills.includes(skill));
    const sharedInterest = person.interests.find(interest => identity.interests.includes(interest));
    const sharedProject = person.projectInterests.find(project => identity.projectInterests.includes(project));
    return { person, score: Number(Boolean(sharedSkill)) * 3 + Number(Boolean(sharedProject)) * 2 + Number(Boolean(sharedInterest)),
      reason: sharedSkill ? 'Shared skill: ' + sharedSkill : sharedProject ? 'Project interest: ' + sharedProject : 'Shared interest: ' + sharedInterest };
  }).filter(match => match.score > 0).sort((a, b) => b.score - a.score || a.person.name.localeCompare(b.person.name));
}
export function connectionFor(personId: string, requests: readonly ConnectionRequest[]) {
  return requests.find(request => request.personId === personId && request.status !== 'declined');
}
