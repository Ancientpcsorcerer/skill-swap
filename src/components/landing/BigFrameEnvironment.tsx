import background from '../../../Ideas/Background_1.png';
// Environment-only composition: reference architecture/floor, without its UI or portal.
// The existing media supplies the locked Frame above this layer.
export function BigFrameEnvironment() {
  return <svg className="plate-video big-frame-environment" viewBox="0 0 1664 1248" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="frame-environment-sky" x2="0" y2="1"><stop stopColor="#d9dde0"/><stop offset=".65" stopColor="#eee6dc"/><stop offset="1" stopColor="#f5e9d8"/></linearGradient>
      <clipPath id="frame-environment-walls"><path d="M0 0H110V125L297 315V787L0 824ZM1234 294L1370 159H1460V805L1234 789Z"/></clipPath>
    </defs>
    <rect width="1664" height="1248" fill="url(#frame-environment-sky)"/>
    <path d="M0 878L119 835L208 861L353 823L470 868L577 809L677 850L794 818L917 866L1040 789L1144 820L1268 771L1401 826L1538 806L1664 862V990H0Z" fill="#aeb2b0" opacity=".58"/>
    <path d="M0 940L180 886L299 919L424 870L549 934L711 881L883 932L1040 874L1198 923L1370 857L1511 902L1664 877V999H0Z" fill="#939c9c" opacity=".35"/>
    <svg x="0" y="976" width="1664" height="272" viewBox="0 800 1460 140" preserveAspectRatio="none"><image href={background} width="1460" height="1077"/></svg>
    <g transform="scale(1.139726 1.252)"><image href={background} width="1460" height="1077" clipPath="url(#frame-environment-walls)"/><path d="M1234 294L1370 159V299Z" fill="#787773"/></g>
    <path d="M338 905H422V976H338ZM422 936H480V976H422ZM1104 943H1406V986H1104Z" fill="#d0c9bd"/>
    <path d="M338 905L362 909V976H338ZM1104 943L1130 948V986H1104Z" fill="#eee4d2"/>
    <path d="M422 976L472 985H338ZM1130 986L1430 998H1104Z" fill="#77756e" opacity=".18"/>
  </svg>;
}
