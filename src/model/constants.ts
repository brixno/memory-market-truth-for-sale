import type { Archive, ArchiveChoice, CaseField, GameMode, Law, Mission, ModeConfig, RelationType } from './types';

export const CASE_FIELDS: CaseField[] = ['suspect', 'place', 'evidence', 'time'];

export const FIELD_LABELS: Record<CaseField, string> = {
  suspect: '범인',
  place: '장소',
  evidence: '핵심 물증',
  time: '시간대'
};

export const ARCHIVES: Archive[] = ['people', 'space', 'evidence', 'time'];

export const ARCHIVE_LABELS: Record<ArchiveChoice, string> = {
  people: '인물 정보실',
  space: '장소 정보실',
  evidence: '물증 정보실',
  time: '시간 정보실',
  admin: '지원 데스크',
  notary: '확인소',
  funding: '자금 데스크'
};

export const RELATION_LABELS: Record<RelationType, string> = {
  suspect_place: '범인×장소',
  suspect_evidence: '범인×핵심 물증',
  place_evidence: '장소×핵심 물증',
  place_time: '장소×시간대',
  suspect_time: '범인×시간대'
};

export const RELATION_FIELDS: Record<RelationType, [CaseField, CaseField]> = {
  suspect_place: ['suspect', 'place'],
  suspect_evidence: ['suspect', 'evidence'],
  place_evidence: ['place', 'evidence'],
  place_time: ['place', 'time'],
  suspect_time: ['suspect', 'time']
};

export const RELATION_CLAIM_TEXT: Record<RelationType, string> = {
  suspect_place: '범인은 사건 장소에 자연스럽게 접근할 수 있었다.',
  suspect_evidence: '범인은 핵심 물증을 다룰 수 있었다.',
  place_evidence: '핵심 물증은 사건 장소 또는 인접 구역에서 구할 수 있었다.',
  place_time: '사건 장소는 해당 시간대에 사건이 벌어지기 적합했다.',
  suspect_time: '범인은 해당 시간대에 수상하지 않게 움직일 수 있었다.'
};

export const MODE_ORDER: GameMode[] = ['light', 'standard_basic', 'standard_plus', 'grand', 'extreme'];

export const MODE_CONFIGS: Record<GameMode, ModeConfig> = {
  light: {
    mode: 'light',
    nameKo: '라이트',
    playerMin: 4,
    playerMax: 6,
    recommendedPlayers: 5,
    rounds: 4,
    candidateCountPerField: 5,
    totalRecordCount: 48,
    recordsPerArchive: 12,
    estimatedTimeKo: '60~90분',
    descriptionKo:
      '라이트 모드는 60~90분짜리 추리·거래 입문 전략 게임입니다. 규칙 카드와 개인 목표를 제거해 부담을 낮추면서도, 기억시장의 핵심인 원본 공식 기록, 공식 복사본, 증거 이용권 거래를 가장 가볍게 체험할 수 있습니다.',
    usesLaws: false,
    usesLawAuction: false,
    usesMissions: false,
    missionReward: 0,
    usesTips: true,
    allowsRumors: false,
    claimStakeMin: 1,
    claimStakeMax: 1,
    evidencePerField: 1,
    relationEvidenceTotalLimit: 2,
    allowedRelationTypes: ['suspect_place', 'suspect_evidence', 'place_evidence'],
    allowStrongRelationClaims: false,
    royaltyRule: 'light_cap_2'
  },
  standard_basic: {
    mode: 'standard_basic',
    nameKo: '스탠다드 기본',
    playerMin: 5,
    playerMax: 8,
    recommendedPlayers: 6,
    rounds: 5,
    candidateCountPerField: 6,
    totalRecordCount: 72,
    recordsPerArchive: 18,
    estimatedTimeKo: '90~120분',
    descriptionKo: '새 정식 기본판입니다. 확인 안 된 제보와 이용 보너스 규칙을 기본으로 사용하고 규칙 카드와 개인 목표는 제외합니다.',
    usesLaws: false,
    usesLawAuction: false,
    usesMissions: false,
    missionReward: 0,
    usesTips: true,
    allowsRumors: false,
    claimStakeMin: 1,
    claimStakeMax: 2,
    evidencePerField: 2,
    relationEvidencePerFieldLimit: 1,
    allowedRelationTypes: ['suspect_place', 'suspect_evidence', 'place_evidence', 'place_time'],
    allowStrongRelationClaims: false,
    royaltyRule: 'automatic'
  },
  standard_plus: {
    mode: 'standard_plus',
    nameKo: '스탠다드 플러스',
    playerMin: 5,
    playerMax: 8,
    recommendedPlayers: 6,
    rounds: 5,
    candidateCountPerField: 6,
    totalRecordCount: 72,
    recordsPerArchive: 18,
    estimatedTimeKo: '100~130분',
    descriptionKo: '스탠다드 기본에 간소 개인 목표, 강한 연결 주장, 선택 소문 생성, 선택 공개 규칙 카드를 더한 모드입니다.',
    usesLaws: true,
    usesLawAuction: false,
    usesMissions: true,
    missionReward: 4,
    usesTips: true,
    allowsRumors: true,
    rumorLimitPerPlayer: 1,
    claimStakeMin: 1,
    claimStakeMax: 2,
    evidencePerField: 2,
    relationEvidencePerFieldLimit: 1,
    allowedRelationTypes: ['suspect_place', 'suspect_evidence', 'place_evidence', 'place_time'],
    allowStrongRelationClaims: true,
    royaltyRule: 'automatic'
  },
  grand: {
    mode: 'grand',
    nameKo: '그랜드',
    playerMin: 6,
    playerMax: 10,
    recommendedPlayers: 8,
    rounds: 5,
    candidateCountPerField: 6,
    totalRecordCount: 80,
    recordsPerArchive: 20,
    estimatedTimeKo: '120~150분',
    descriptionKo:
      '숙련자용 확장판입니다. 연결 단서 5종, 규칙 카드, 개인 목표, 확인 안 된 제보와 제한적 소문 생성을 사용합니다.',
    usesLaws: true,
    usesLawAuction: false,
    usesMissions: true,
    missionReward: 6,
    usesTips: true,
    allowsRumors: true,
    rumorLimitPerPlayer: 1,
    claimStakeMin: 1,
    claimStakeMax: 3,
    evidencePerField: 2,
    relationEvidencePerFieldLimit: 1,
    allowedRelationTypes: ['suspect_place', 'suspect_evidence', 'place_evidence', 'place_time', 'suspect_time'],
    allowStrongRelationClaims: true,
    royaltyRule: 'grand_default'
  },
  extreme: {
    mode: 'extreme',
    nameKo: '익스트림',
    playerMin: 8,
    playerMax: 12,
    recommendedPlayers: 10,
    rounds: 6,
    candidateCountPerField: 6,
    totalRecordCount: 96,
    recordsPerArchive: 24,
    estimatedTimeKo: '150~210분',
    descriptionKo: '기존 v1.1 풀버전을 보존한 방송, 이벤트, 하드게이머용 모드입니다.',
    usesLaws: true,
    usesLawAuction: true,
    usesMissions: true,
    missionReward: 6,
    usesTips: false,
    allowsRumors: true,
    claimStakeMin: 1,
    claimStakeMax: 3,
    evidencePerField: 2,
    relationEvidencePerFieldLimit: 1,
    allowedRelationTypes: ['suspect_place', 'suspect_evidence', 'place_evidence', 'place_time', 'suspect_time'],
    allowStrongRelationClaims: true,
    royaltyRule: 'law_only'
  }
};

export const STARTING_COINS = 8;

export const PHASE_LABELS: Record<string, string> = {
  setup: '게임 설정',
  archiveSelection: '방문 장소 선택',
  archiveResolution: '정보 확인',
  market: '거래',
  publicClaim: '공개 주장',
  lawAuction: '규칙 카드 처리',
  finalSubmission: '최종 제출',
  gameOver: '점수 공개'
};

export const LAWS: Law[] = [
  {
    id: 'original_certification_priority',
    nameKo: '원본 우대 규칙',
    family: 'evidence',
    descriptionKo: '원본 공식 기록의 증거 점수는 +1, 공식 복사본의 증거 점수는 -1입니다. 증거 점수는 0 미만으로 내려가지 않습니다.'
  },
  {
    id: 'certified_copy_equality',
    nameKo: '복사본 동등 규칙',
    family: 'evidence',
    descriptionKo: '공식 복사본도 원본과 같은 증거 점수로 계산합니다. 제보와 소문은 여전히 공식 증거가 아닙니다.'
  },
  {
    id: 'use_right_royalty',
    nameKo: '이용 보너스 규칙',
    family: 'useRight',
    descriptionKo: '타인이 내가 발행한 증거 이용권으로 실제 증거 점수를 얻으면 나도 +1점을 얻습니다.'
  },
  {
    id: 'claim_accountability',
    nameKo: '말의 무게 규칙',
    family: 'claim',
    descriptionKo: '공개 주장 참 보상과 거짓 감점이 베팅×4로 강화됩니다.'
  },
  {
    id: 'storage_burden',
    nameKo: '기록 보관 비용',
    family: 'storage',
    descriptionKo: '라운드 종료 시 공식 기록을 7장 초과 보유하면 초과 1장당 2코인을 냅니다. 미납 1코인당 최종 -1점입니다.'
  }
];

export const MISSIONS: Mission[] = [
  {
    id: 'evidence_broker',
    nameKo: '증거 연결자',
    reward: 6,
    descriptionKo: '다른 플레이어 3명 이상이 내가 발행한 증거 이용권으로 실제 증거 점수를 얻으면 달성합니다.'
  },
  {
    id: 'hermit_investigator',
    nameKo: '혼자 푸는 탐정',
    reward: 6,
    descriptionKo: '빌린 증거 이용권을 최종 제출에 쓰지 않고 정답 3개 이상을 맞히면 달성합니다.'
  },
  {
    id: 'public_accuser',
    nameKo: '공개 고발자',
    reward: 6,
    descriptionKo: '공개 주장 4회 이상, 그중 참 3회 이상이면 달성합니다.'
  },
  {
    id: 'original_collector',
    nameKo: '원본 수집가',
    reward: 6,
    descriptionKo: '최종 제출 네 항목에 서로 다른 원본 공식 기록을 하나 이상 붙이면 달성합니다.'
  },
  {
    id: 'copy_distributor',
    nameKo: '복사본 장인',
    reward: 6,
    descriptionKo: '최종 제출 시점에 공식 복사본 기록을 4장 이상 소유하면 달성합니다.'
  },
  {
    id: 'rumor_auditor',
    nameKo: '소문 확인자',
    reward: 6,
    descriptionKo: '소문 또는 제보 3장 이상을 확인했고 그중 2장 이상이 거짓이면 달성합니다.'
  },
  {
    id: 'record_monopolist',
    nameKo: '기록 독점자',
    reward: 6,
    descriptionKo: '같은 항목을 참조하는 원본 공식 기록을 4장 이상 소유하면 달성합니다.'
  }
];
