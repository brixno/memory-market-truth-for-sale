export type GameMode = 'light' | 'standard_basic' | 'standard_plus' | 'grand' | 'extreme';

export type CaseField = 'suspect' | 'place' | 'evidence' | 'time';

export type Archive = 'people' | 'space' | 'evidence' | 'time';

export type FacilityChoice = 'admin' | 'notary' | 'funding';

export type ArchiveChoice = Archive | FacilityChoice;

export type Candidate = {
  id: string;
  field: CaseField;
  nameKo: string;
  subtitleKo?: string;
  descriptionKo?: string;
  tags: string[];
  activeInModes: GameMode[];
};

export type CaseSolution = {
  suspectId: string;
  placeId: string;
  evidenceId: string;
  timeId: string;
};

export type RelationType =
  | 'suspect_place'
  | 'suspect_evidence'
  | 'place_evidence'
  | 'place_time'
  | 'suspect_time';

export type RelationScoreTable = Record<RelationType, Record<string, number>>;

export type Predicate =
  | {
      type: 'entityHasTag';
      field: CaseField;
      tag: string;
      displayKo: string;
    }
  | {
      type: 'entityLacksTag';
      field: CaseField;
      tag: string;
      displayKo: string;
    }
  | {
      type: 'relationAtLeast';
      relationType: RelationType;
      threshold: 2 | 3;
      displayKo: string;
    };

export type RecordType = 'single' | 'relation';
export type RecordStage = 1 | 2 | 3;

export type NotarizedRecord = {
  id: string;
  caseId: string;
  originalFamilyId: string;
  archive: Archive;
  stage: RecordStage;
  recordType: RecordType;
  fields: CaseField[];
  predicate: Predicate;
  icons: string[];
  textKo: string;
  evidenceValue: number;
  origin: 'original' | 'certified_copy';
  ownerId?: string;
  sourceOriginalId?: string;
};

export type UnconfirmedTip = {
  id: string;
  caseId: string;
  predicate: Predicate;
  textKo: string;
  truth: boolean;
  ownerId?: string;
  auditedByPlayerIds: string[];
};

export type RumorCard = {
  id: string;
  predicate: Predicate;
  textKo: string;
  creatorId: string;
  ownerId: string;
  auditedByPlayerIds: string[];
};

export type UseRight = {
  id: string;
  originalFamilyId: string;
  recordId: string;
  issuerId: string;
  borrowerId: string;
  price: number;
  createdRound: number;
  used: boolean;
  usedForField?: CaseField;
  producedEvidenceScore?: boolean;
};

export type PublicClaim = {
  id: string;
  playerId: string;
  round: number;
  predicate: Predicate;
  textKo: string;
  stake: number;
};

export type Law = {
  id: string;
  nameKo: string;
  family: 'evidence' | 'useRight' | 'claim' | 'storage';
  descriptionKo: string;
};

export type Mission = {
  id: string;
  nameKo: string;
  descriptionKo: string;
  reward: number;
};

export type FinalSubmission = {
  guesses: CaseSolution;
  evidenceByField: Record<CaseField, string[]>;
};

export type Player = {
  id: string;
  name: string;
  type: 'human' | 'ai';
  coins: number;
  recordIds: string[];
  tipIds: string[];
  rumorIds: string[];
  useRightIds: string[];
  issuedUseRightIds: string[];
  missionId?: string;
  falseClaimCount: number;
  taxDebt: number;
  finalSubmission?: FinalSubmission;
};

export type GamePhase =
  | 'setup'
  | 'archiveSelection'
  | 'archiveResolution'
  | 'market'
  | 'publicClaim'
  | 'lawAuction'
  | 'finalSubmission'
  | 'gameOver';

export type GameLogEntry = {
  id: string;
  round: number;
  phase: GamePhase;
  messageKo: string;
};

export type RngState = {
  seed: string;
  state: number;
};

export type PendingArchiveDraw = {
  playerId: string;
  archive: Archive;
  recordIds: string[];
};

export type CongestionBid = number | 'pass';

export type PendingCongestionAuction = {
  archive: Archive;
  recordId: string;
  visitorIds: string[];
  bids: Record<string, CongestionBid>;
  resolved: boolean;
};

export type ArchiveResolutionState = {
  pendingDraws: PendingArchiveDraw[];
  pendingAuctions: PendingCongestionAuction[];
  resolved: boolean;
};

export type LawAuctionState = {
  candidates: Law[];
  bids: Record<string, number>;
  winnerId?: string;
  resolved: boolean;
};

export type CandidateMark = 'possible' | 'uncertain' | 'excluded';

export type GameState = {
  version: '1.3.1';
  seed: string;
  rngState: RngState;
  mode: GameMode;
  caseEnvelopeId: string;
  caseTitleKo: string;
  caseDescriptionKo: string;
  round: number;
  phase: GamePhase;
  startPlayerId: string;
  solution: CaseSolution;
  candidates: Candidate[];
  officialTags: string[];
  relationScores: RelationScoreTable;
  archives: Record<Archive, string[]>;
  discardedRecordIds: string[];
  records: Record<string, NotarizedRecord>;
  tipDeck: string[];
  tips: Record<string, UnconfirmedTip>;
  rumors: Record<string, RumorCard>;
  useRights: Record<string, UseRight>;
  publicClaims: PublicClaim[];
  pendingPublicClaims: PublicClaim[];
  activeLaws: Law[];
  players: Player[];
  logs: GameLogEntry[];
  archiveChoices: Record<string, ArchiveChoice>;
  archiveResolution: ArchiveResolutionState;
  adminAccessPlayerIds: string[];
  notaryCredits: Record<string, number>;
  marketDonePlayerIds: string[];
  publicClaimDonePlayerIds: string[];
  lawAuction?: LawAuctionState;
  candidateMarks: Record<string, Record<string, CandidateMark>>;
  debugShowSolution: boolean;
  debugShowRelations: boolean;
  scoreBreakdowns?: ScoreBreakdown[];
};

export type ScoreBreakdown = {
  playerId: string;
  answerScore: number;
  evidenceScore: number;
  publicClaimScore: number;
  missionScore: number;
  coinScore: number;
  royaltyScore: number;
  penalties: number;
  correctCount: number;
  total: number;
  invalidEvidenceIds: string[];
  scoredOriginalFamilyIds: string[];
  details: string[];
};

export type ModeConfig = {
  mode: GameMode;
  nameKo: string;
  playerMin: number;
  playerMax: number;
  recommendedPlayers: number;
  rounds: number;
  candidateCountPerField: number;
  totalRecordCount: number;
  recordsPerArchive: number;
  estimatedTimeKo: string;
  descriptionKo: string;
  usesLaws: boolean;
  usesLawAuction: boolean;
  usesMissions: boolean;
  missionReward: number;
  usesTips: boolean;
  allowsRumors: boolean;
  rumorLimitPerPlayer?: number;
  claimStakeMin: number;
  claimStakeMax: number;
  evidencePerField: number;
  relationEvidenceTotalLimit?: number;
  relationEvidencePerFieldLimit?: number;
  allowedRelationTypes: RelationType[];
  allowStrongRelationClaims: boolean;
  royaltyRule: 'light_cap_2' | 'automatic' | 'law_only' | 'grand_default';
};

export type CaseEnvelope = {
  id: string;
  caseId: string;
  mode: GameMode;
  titleKo: string;
  descriptionKo: string;
  solution: CaseSolution;
  candidates: Candidate[];
  officialTags: string[];
  relationScores: RelationScoreTable;
  records: Record<string, NotarizedRecord>;
  archives: Record<Archive, string[]>;
  tips: Record<string, UnconfirmedTip>;
  tipDeck: string[];
};

export type NewGameOptions = {
  mode: GameMode;
  playerCount: number;
  humanCount: number;
  humanNames: string[];
  seed: string;
  caseEnvelopeId: string;
};

export type SimulationOptions = {
  mode: GameMode;
  playerCount: number;
  seed: string;
  caseEnvelopeId: string;
};

export type SimulationResult = {
  success: boolean;
  seed: string;
  mode: GameMode;
  playerCount: number;
  winnerId?: string;
  totalRounds: number;
  errors: string[];
  scoreBreakdowns?: ScoreBreakdown[];
};
