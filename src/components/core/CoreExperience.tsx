import { CoreSystem } from './CoreSystem';

interface Props { position: number; active: boolean; available: boolean }
export function CoreExperience(props: Props) { return <CoreSystem {...props} />; }
