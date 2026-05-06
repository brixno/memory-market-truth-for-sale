import { ARCHIVES, CASE_FIELDS, MODE_CONFIGS, MODE_ORDER, RELATION_FIELDS, RELATION_LABELS } from './constants';
import type {
  Archive,
  Candidate,
  CaseEnvelope,
  CaseField,
  CaseSolution,
  GameMode,
  NotarizedRecord,
  Predicate,
  RelationScoreTable,
  RelationType,
  UnconfirmedTip
} from './types';

const ALL_MODES: GameMode[] = [...MODE_ORDER];
const NON_LIGHT: GameMode[] = ['standard_basic', 'standard_plus', 'grand', 'extreme'];

export const ALL_CANDIDATES: Candidate[] = [
  {
    id: 'suspect-han',
    field: 'suspect',
    nameKo: '경비팀장 한도윤',
    tags: ['내부', '야간', '보안', '감시', '기계', '내부갈등'],
    activeInModes: ALL_MODES
  },
  {
    id: 'suspect-seo',
    field: 'suspect',
    nameKo: '탐사보도 기자 서민재',
    tags: ['외부', '언론', '전산', '정보공유', '파일반출', '출입기록'],
    activeInModes: NON_LIGHT
  },
  {
    id: 'suspect-oh',
    field: 'suspect',
    nameKo: '회계 담당자 오채린',
    tags: ['내부', '야간', '문서', '금전', '전산', '파일보관'],
    activeInModes: ALL_MODES
  },
  {
    id: 'suspect-ryu',
    field: 'suspect',
    nameKo: '선임 연구원 류지훈',
    tags: ['내부', '야간', '보안', '약품', '연구', '기밀자료'],
    activeInModes: ALL_MODES
  },
  {
    id: 'suspect-kang',
    field: 'suspect',
    nameKo: '대표 비서 강해나',
    tags: ['내부', '야간', '일정', '방문예약', '회의', '전산'],
    activeInModes: ALL_MODES
  },
  {
    id: 'suspect-park',
    field: 'suspect',
    nameKo: '설비 정비공 박태성',
    tags: ['협력', '야간', '기계', '감시', '비품', '정비'],
    activeInModes: ALL_MODES
  },
  {
    id: 'place-lobby',
    field: 'place',
    nameKo: '로비',
    tags: ['공개', '출입가능', 'CCTV', '혼잡', '비품', '기록'],
    activeInModes: ALL_MODES
  },
  {
    id: 'place-archive',
    field: 'place',
    nameKo: '자료보관실',
    tags: ['제한', '문서', '사각', '기록', '조용', '출입확인'],
    activeInModes: ALL_MODES
  },
  {
    id: 'place-server',
    field: 'place',
    nameKo: '서버실',
    tags: ['보안강함', '전산', '기록', '소음', '전력', '출입금지'],
    activeInModes: NON_LIGHT
  },
  {
    id: 'place-board',
    field: 'place',
    nameKo: '이사회 회의실',
    tags: ['회의', '일정', '사각', '조용', '문서', '전자기기'],
    activeInModes: ALL_MODES
  },
  {
    id: 'place-lab',
    field: 'place',
    nameKo: '실험실',
    tags: ['보안', '약품', '연구', '기록', '소음', '출입금지'],
    activeInModes: ALL_MODES
  },
  {
    id: 'place-parking',
    field: 'place',
    nameKo: '지하주차장',
    tags: ['외부통로', '사각', '조명약함', '차량', '비품', '소음'],
    activeInModes: ALL_MODES
  },
  {
    id: 'evidence-keycard',
    field: 'evidence',
    nameKo: '마스터 열쇠카드',
    tags: ['출입확인', '휴대', '기록', '제한구역', '회사물품', '흔적적음'],
    activeInModes: ALL_MODES
  },
  {
    id: 'evidence-wrench',
    field: 'evidence',
    nameKo: '정비용 렌치',
    tags: ['공구', '금속', '전원없음', '현장물품', '기계', '흔적'],
    activeInModes: ALL_MODES
  },
  {
    id: 'evidence-laptop',
    field: 'evidence',
    nameKo: '업무용 노트북',
    tags: ['전자', '전산', '휴대', '회사물품', '기록', '파일열람'],
    activeInModes: ALL_MODES
  },
  {
    id: 'evidence-sedative',
    field: 'evidence',
    nameKo: '진정제 약병',
    tags: ['약품', '전원없음', '휴대', '관리대장', '신체흔적', '연구'],
    activeInModes: ALL_MODES
  },
  {
    id: 'evidence-usb',
    field: 'evidence',
    nameKo: '암호화 USB',
    tags: ['전자', '파일반출', '숨김', '휴대', '접속흔적', '전산'],
    activeInModes: NON_LIGHT
  },
  {
    id: 'evidence-extinguisher',
    field: 'evidence',
    nameKo: '분말 소화기',
    tags: ['비상', '현장물품', '전원없음', '금속', '흔적', '비품'],
    activeInModes: ALL_MODES
  },
  {
    id: 'time-rush',
    field: 'time',
    nameKo: '퇴근 혼잡대, 18:00~19:00',
    tags: ['출입가능', '혼잡', 'CCTV작동', '교대전', '목격많음', '기록많음'],
    activeInModes: ALL_MODES
  },
  {
    id: 'time-visitors',
    field: 'time',
    nameKo: '방문객 정리대, 19:00~20:00',
    tags: ['출입마감', '직원적음', 'CCTV작동', '기록많음', '혼자남음'],
    activeInModes: ALL_MODES
  },
  {
    id: 'time-patrol',
    field: 'time',
    nameKo: '1차 순찰대, 20:00~21:00',
    tags: ['출입금지', '순찰많음', '야간출입', '잠금강함', 'CCTV작동'],
    activeInModes: ALL_MODES
  },
  {
    id: 'time-surveillance',
    field: 'time',
    nameKo: '감시 점검대, 21:00~22:00',
    tags: ['출입금지', '감시확인', '기록비어있음', '혼자', '순찰예상', '야간출입'],
    activeInModes: ALL_MODES
  },
  {
    id: 'time-shift-gap',
    field: 'time',
    nameKo: '교대 공백대, 22:00~23:00',
    tags: ['출입금지', '교대빈틈', '목격적음', '직원적음', '야간출입'],
    activeInModes: ALL_MODES
  },
  {
    id: 'time-lockdown',
    field: 'time',
    nameKo: '심야 봉쇄대, 23:00~24:00',
    tags: ['출입금지', '봉쇄', '목격적음', '조용', '밤근무'],
    activeInModes: NON_LIGHT
  }
];

export const L001_SOLUTION: CaseSolution = {
  suspectId: 'suspect-ryu',
  placeId: 'place-lab',
  evidenceId: 'evidence-sedative',
  timeId: 'time-surveillance'
};

function relationKey(leftId: string, rightId: string): string {
  return `${leftId}:${rightId}`;
}

function emptyRelationScores(): RelationScoreTable {
  return {
    suspect_place: {},
    suspect_evidence: {},
    place_evidence: {},
    place_time: {},
    suspect_time: {}
  };
}

function tagScore(a: Candidate, b: Candidate, bonuses: Array<[string, string]>): number {
  let score = 1;
  for (const [left, right] of bonuses) {
    if (a.tags.includes(left) && b.tags.includes(right)) score += 1;
  }
  if (a.tags.some((tag) => b.tags.includes(tag))) score += 1;
  return Math.min(3, score);
}

export function buildRelationScores(candidates: Candidate[]): RelationScoreTable {
  const table = emptyRelationScores();
  const byField = (field: CaseField) => candidates.filter((candidate) => candidate.field === field);
  for (const suspect of byField('suspect')) {
    for (const place of byField('place')) {
      table.suspect_place[relationKey(suspect.id, place.id)] = tagScore(suspect, place, [
        ['보안', '보안'],
        ['연구', '연구'],
        ['전산', '전산'],
        ['문서', '문서'],
        ['회의', '회의'],
        ['감시', 'CCTV']
      ]);
    }
    for (const evidence of byField('evidence')) {
      table.suspect_evidence[relationKey(suspect.id, evidence.id)] = tagScore(suspect, evidence, [
        ['약품', '약품'],
        ['전산', '전산'],
        ['기계', '기계'],
        ['비품', '비품'],
        ['연구', '연구'],
        ['파일반출', '파일반출']
      ]);
    }
    for (const time of byField('time')) {
      table.suspect_time[relationKey(suspect.id, time.id)] = tagScore(suspect, time, [
        ['야간', '야간출입'],
        ['감시', '감시확인'],
        ['보안', '잠금강함'],
        ['외부', '출입가능']
      ]);
    }
  }
  for (const place of byField('place')) {
    for (const evidence of byField('evidence')) {
      table.place_evidence[relationKey(place.id, evidence.id)] = tagScore(place, evidence, [
        ['약품', '약품'],
        ['전산', '전산'],
        ['비품', '현장물품'],
        ['기록', '기록'],
        ['연구', '연구'],
        ['소음', '기계']
      ]);
    }
    for (const time of byField('time')) {
      table.place_time[relationKey(place.id, time.id)] = tagScore(place, time, [
        ['출입금지', '출입금지'],
        ['조용', '혼자'],
        ['기록', '기록많음'],
        ['사각', '목격적음'],
        ['보안', '야간출입']
      ]);
    }
  }
  table.suspect_place[relationKey('suspect-ryu', 'place-lab')] = 3;
  table.suspect_evidence[relationKey('suspect-ryu', 'evidence-sedative')] = 3;
  table.place_evidence[relationKey('place-lab', 'evidence-sedative')] = 3;
  table.place_time[relationKey('place-lab', 'time-surveillance')] = 3;
  table.suspect_time[relationKey('suspect-ryu', 'time-surveillance')] = 3;
  return table;
}

function entityPredicate(type: 'entityHasTag' | 'entityLacksTag', field: CaseField, tag: string, textKo: string): Predicate {
  const subject = field === 'suspect' ? '범인은' : field === 'place' ? '장소에는' : field === 'evidence' ? '핵심 물증에는' : '시간대에는';
  const displayKo = `${subject} [${tag}] 키워드가 ${type === 'entityHasTag' ? '있다' : '없다'}.`;
  return { type, field, tag, displayKo: displayKo || textKo };
}

function relationPredicate(relationType: RelationType, threshold: 2 | 3, textKo: string): Predicate {
  return { type: 'relationAtLeast', relationType, threshold, displayKo: textKo };
}

type RecordDraft = Omit<NotarizedRecord, 'id' | 'caseId' | 'origin'> & { id: string };

function record(draft: RecordDraft): NotarizedRecord {
  return {
    ...draft,
    id: draft.id,
    caseId: 'L001',
    origin: 'original'
  };
}

const LIGHT_RECORDS: NotarizedRecord[] = [
  record({ id: 'L001-P-01', originalFamilyId: 'L001-P-01', archive: 'people', stage: 1, recordType: 'single', fields: ['suspect'], icons: ['범인', '내부'], textKo: '범인은 내부 임직원이다.', evidenceValue: 1, predicate: entityPredicate('entityHasTag', 'suspect', '내부', '범인은 내부 태그를 가진다.') }),
  record({ id: 'L001-P-02', originalFamilyId: 'L001-P-02', archive: 'people', stage: 1, recordType: 'single', fields: ['suspect'], icons: ['범인', '야간'], textKo: '범인은 야간에 건물 안에 머물 수 있었다.', evidenceValue: 1, predicate: entityPredicate('entityHasTag', 'suspect', '야간', '범인은 야간 태그를 가진다.') }),
  record({ id: 'L001-P-03', originalFamilyId: 'L001-P-03', archive: 'people', stage: 1, recordType: 'single', fields: ['suspect'], icons: ['범인', '외부X'], textKo: '범인은 외부 방문자 전용 신분이 아니다.', evidenceValue: 1, predicate: entityPredicate('entityLacksTag', 'suspect', '외부', '범인은 외부 태그를 가지지 않는다.') }),
  record({ id: 'L001-P-04', originalFamilyId: 'L001-P-04', archive: 'people', stage: 1, recordType: 'single', fields: ['suspect'], icons: ['범인', '연구'], textKo: '범인은 연구 업무상 피해자와 접점이 있었다.', evidenceValue: 1, predicate: entityPredicate('entityHasTag', 'suspect', '연구', '범인은 연구 태그를 가진다.') }),
  record({ id: 'L001-P-05', originalFamilyId: 'L001-P-05', archive: 'people', stage: 1, recordType: 'single', fields: ['suspect'], icons: ['범인', '보안'], textKo: '범인은 보안구역 관련 권한이 있었다.', evidenceValue: 2, predicate: entityPredicate('entityHasTag', 'suspect', '보안', '범인은 보안 태그를 가진다.') }),
  record({ id: 'L001-P-06', originalFamilyId: 'L001-P-06', archive: 'people', stage: 1, recordType: 'single', fields: ['suspect'], icons: ['범인', '기밀자료'], textKo: '범인은 기밀 연구 자료와 관련된 업무를 맡고 있었다.', evidenceValue: 2, predicate: entityPredicate('entityHasTag', 'suspect', '기밀자료', '범인은 기밀자료 태그를 가진다.') }),
  record({ id: 'L001-P-07', originalFamilyId: 'L001-P-07', archive: 'people', stage: 1, recordType: 'relation', fields: ['suspect', 'place'], icons: ['범인+장소', '동선'], textKo: '범인은 사건 장소의 기본 동선을 알고 있었다.', evidenceValue: 2, predicate: relationPredicate('suspect_place', 2, '범인은 사건 장소에 자연스럽게 접근할 수 있었다.') }),
  record({ id: 'L001-P-08', originalFamilyId: 'L001-P-08', archive: 'people', stage: 1, recordType: 'relation', fields: ['suspect', 'evidence'], icons: ['범인+물증', '접촉'], textKo: '범인은 핵심 물증을 접할 수 있는 직무에 있었다.', evidenceValue: 2, predicate: relationPredicate('suspect_evidence', 2, '범인은 핵심 물증을 다룰 수 있었다.') }),
  record({ id: 'L001-P-09', originalFamilyId: 'L001-P-09', archive: 'people', stage: 2, recordType: 'single', fields: ['suspect'], icons: ['범인', '약품'], textKo: '범인은 약품 취급 권한자다.', evidenceValue: 3, predicate: entityPredicate('entityHasTag', 'suspect', '약품', '범인은 약품 태그를 가진다.') }),
  record({ id: 'L001-P-10', originalFamilyId: 'L001-P-10', archive: 'people', stage: 2, recordType: 'single', fields: ['suspect'], icons: ['범인', '기밀자료'], textKo: '범인은 기밀 연구 자료에 접근할 수 있었다.', evidenceValue: 3, predicate: entityPredicate('entityHasTag', 'suspect', '기밀자료', '범인은 기밀자료 태그를 가진다.') }),
  record({ id: 'L001-P-11', originalFamilyId: 'L001-P-11', archive: 'people', stage: 2, recordType: 'relation', fields: ['suspect', 'place'], icons: ['범인+장소', '접근'], textKo: '범인은 사건 장소에 자연스럽게 접근할 수 있었다.', evidenceValue: 2, predicate: relationPredicate('suspect_place', 2, '범인은 사건 장소에 자연스럽게 접근할 수 있었다.') }),
  record({ id: 'L001-P-12', originalFamilyId: 'L001-P-12', archive: 'people', stage: 2, recordType: 'relation', fields: ['suspect', 'evidence'], icons: ['범인+물증', '숙련'], textKo: '범인은 핵심 물증을 업무상 다룰 수 있었다.', evidenceValue: 2, predicate: relationPredicate('suspect_evidence', 2, '범인은 핵심 물증을 다룰 수 있었다.') }),

  record({ id: 'L001-S-01', originalFamilyId: 'L001-S-01', archive: 'space', stage: 1, recordType: 'single', fields: ['place'], icons: ['장소', '공개X'], textKo: '사건 장소는 완전한 공개 구역이 아니다.', evidenceValue: 1, predicate: entityPredicate('entityLacksTag', 'place', '공개', '사건 장소는 공개 태그를 가지지 않는다.') }),
  record({ id: 'L001-S-02', originalFamilyId: 'L001-S-02', archive: 'space', stage: 1, recordType: 'single', fields: ['place'], icons: ['장소', '외부통로X'], textKo: '사건 장소는 외부 차량 동선만으로 설명되는 곳이 아니다.', evidenceValue: 1, predicate: entityPredicate('entityLacksTag', 'place', '외부통로', '사건 장소에는 외부통로 키워드가 없다.') }),
  record({ id: 'L001-S-03', originalFamilyId: 'L001-S-03', archive: 'space', stage: 1, recordType: 'single', fields: ['place'], icons: ['장소', '기록'], textKo: '사건 장소에는 출입 또는 이용 기록이 남을 수 있다.', evidenceValue: 2, predicate: entityPredicate('entityHasTag', 'place', '기록', '사건 장소는 기록 태그를 가진다.') }),
  record({ id: 'L001-S-04', originalFamilyId: 'L001-S-04', archive: 'space', stage: 1, recordType: 'single', fields: ['place'], icons: ['장소', '소음'], textKo: '사건 장소에는 장비 소음이 있을 수 있다.', evidenceValue: 2, predicate: entityPredicate('entityHasTag', 'place', '소음', '사건 장소는 소음 태그를 가진다.') }),
  record({ id: 'L001-S-05', originalFamilyId: 'L001-S-05', archive: 'space', stage: 1, recordType: 'single', fields: ['place'], icons: ['장소', '출입금지'], textKo: '사건 장소는 일반 방문객이 단독으로 접근하기 어렵다.', evidenceValue: 2, predicate: entityPredicate('entityHasTag', 'place', '출입금지', '사건 장소에게 출입금지 키워드가 있다.') }),
  record({ id: 'L001-S-06', originalFamilyId: 'L001-S-06', archive: 'space', stage: 1, recordType: 'single', fields: ['place'], icons: ['장소', '문서X'], textKo: '사건 장소는 조사 문서 보관만을 위한 공간은 아니다.', evidenceValue: 1, predicate: entityPredicate('entityLacksTag', 'place', '문서', '사건 장소에는 문서 키워드가 없다.') }),
  record({ id: 'L001-S-07', originalFamilyId: 'L001-S-07', archive: 'space', stage: 1, recordType: 'relation', fields: ['suspect', 'place'], icons: ['범인+장소', '동선'], textKo: '범인은 사건 장소의 기본 동선을 알고 있었다.', evidenceValue: 2, predicate: relationPredicate('suspect_place', 2, '범인은 사건 장소에 자연스럽게 접근할 수 있었다.') }),
  record({ id: 'L001-S-08', originalFamilyId: 'L001-S-08', archive: 'space', stage: 1, recordType: 'relation', fields: ['place', 'evidence'], icons: ['장소+물증', '현장성'], textKo: '핵심 물증은 사건 장소의 업무 성격과 맞물린다.', evidenceValue: 2, predicate: relationPredicate('place_evidence', 2, '핵심 물증은 사건 장소 또는 인접 구역에서 구할 수 있었다.') }),
  record({ id: 'L001-S-09', originalFamilyId: 'L001-S-09', archive: 'space', stage: 2, recordType: 'single', fields: ['place'], icons: ['장소', '보안'], textKo: '사건 장소는 보안 관리가 적용되는 구역이다.', evidenceValue: 3, predicate: entityPredicate('entityHasTag', 'place', '보안', '사건 장소는 보안 태그를 가진다.') }),
  record({ id: 'L001-S-10', originalFamilyId: 'L001-S-10', archive: 'space', stage: 2, recordType: 'single', fields: ['place'], icons: ['장소', '약품'], textKo: '사건 장소에는 약품이 보관될 수 있다.', evidenceValue: 3, predicate: entityPredicate('entityHasTag', 'place', '약품', '사건 장소는 약품 태그를 가진다.') }),
  record({ id: 'L001-S-11', originalFamilyId: 'L001-S-11', archive: 'space', stage: 2, recordType: 'relation', fields: ['suspect', 'place'], icons: ['범인+장소', '권한'], textKo: '범인은 사건 장소의 제한을 통과할 수 있었다.', evidenceValue: 2, predicate: relationPredicate('suspect_place', 2, '범인은 사건 장소에 자연스럽게 접근할 수 있었다.') }),
  record({ id: 'L001-S-12', originalFamilyId: 'L001-S-12', archive: 'space', stage: 2, recordType: 'relation', fields: ['place', 'evidence'], icons: ['장소+물증', '관리'], textKo: '핵심 물증은 사건 장소 또는 인접 구역의 관리 물품이다.', evidenceValue: 2, predicate: relationPredicate('place_evidence', 2, '핵심 물증은 사건 장소 또는 인접 구역에서 구할 수 있었다.') }),

  record({ id: 'L001-E-01', originalFamilyId: 'L001-E-01', archive: 'evidence', stage: 1, recordType: 'single', fields: ['evidence'], icons: ['물증', '휴대'], textKo: '핵심 물증은 휴대 가능한 물건이다.', evidenceValue: 2, predicate: entityPredicate('entityHasTag', 'evidence', '휴대', '핵심 물증은 휴대 태그를 가진다.') }),
  record({ id: 'L001-E-02', originalFamilyId: 'L001-E-02', archive: 'evidence', stage: 1, recordType: 'single', fields: ['evidence'], icons: ['물증', '전원없음'], textKo: '핵심 물증은 전원 없이도 사건에 의미 있게 사용될 수 있다.', evidenceValue: 2, predicate: entityPredicate('entityHasTag', 'evidence', '전원없음', '핵심 물증에게 전원없음 키워드가 있다.') }),
  record({ id: 'L001-E-03', originalFamilyId: 'L001-E-03', archive: 'evidence', stage: 1, recordType: 'single', fields: ['evidence'], icons: ['물증', '전자X'], textKo: '핵심 물증은 전자기기가 아니다.', evidenceValue: 2, predicate: entityPredicate('entityLacksTag', 'evidence', '전자', '핵심 물증은 전자 태그를 가지지 않는다.') }),
  record({ id: 'L001-E-04', originalFamilyId: 'L001-E-04', archive: 'evidence', stage: 1, recordType: 'single', fields: ['evidence'], icons: ['물증', '신체흔적'], textKo: '핵심 물증은 현장 또는 신체에 흔적을 남길 수 있다.', evidenceValue: 2, predicate: entityPredicate('entityHasTag', 'evidence', '신체흔적', '핵심 물증에게 신체흔적 키워드가 있다.') }),
  record({ id: 'L001-E-05', originalFamilyId: 'L001-E-05', archive: 'evidence', stage: 1, recordType: 'single', fields: ['evidence'], icons: ['물증', '회사물품X'], textKo: '핵심 물증은 일반 사무 장비만으로 설명되지 않는다.', evidenceValue: 1, predicate: entityPredicate('entityLacksTag', 'evidence', '회사물품', '핵심 물증에는 회사물품 키워드가 없다.') }),
  record({ id: 'L001-E-06', originalFamilyId: 'L001-E-06', archive: 'evidence', stage: 1, recordType: 'single', fields: ['evidence'], icons: ['물증', '공구X'], textKo: '핵심 물증은 정비 공구 계열이 아니다.', evidenceValue: 1, predicate: entityPredicate('entityLacksTag', 'evidence', '공구', '핵심 물증은 공구 태그를 가지지 않는다.') }),
  record({ id: 'L001-E-07', originalFamilyId: 'L001-E-07', archive: 'evidence', stage: 1, recordType: 'relation', fields: ['suspect', 'evidence'], icons: ['범인+물증', '접촉'], textKo: '범인은 핵심 물증을 접할 수 있는 직무에 있었다.', evidenceValue: 2, predicate: relationPredicate('suspect_evidence', 2, '범인은 핵심 물증을 다룰 수 있었다.') }),
  record({ id: 'L001-E-08', originalFamilyId: 'L001-E-08', archive: 'evidence', stage: 1, recordType: 'relation', fields: ['place', 'evidence'], icons: ['장소+물증', '현장성'], textKo: '핵심 물증은 사건 장소에서 자연스럽게 존재할 수 있었다.', evidenceValue: 2, predicate: relationPredicate('place_evidence', 2, '핵심 물증은 사건 장소 또는 인접 구역에서 구할 수 있었다.') }),
  record({ id: 'L001-E-09', originalFamilyId: 'L001-E-09', archive: 'evidence', stage: 2, recordType: 'single', fields: ['evidence'], icons: ['물증', '약품'], textKo: '핵심 물증은 약품이다.', evidenceValue: 3, predicate: entityPredicate('entityHasTag', 'evidence', '약품', '핵심 물증은 약품 태그를 가진다.') }),
  record({ id: 'L001-E-10', originalFamilyId: 'L001-E-10', archive: 'evidence', stage: 2, recordType: 'single', fields: ['evidence'], icons: ['물증', '신체흔적'], textKo: '핵심 물증은 신체 흔적을 남길 수 있다.', evidenceValue: 3, predicate: entityPredicate('entityHasTag', 'evidence', '신체흔적', '핵심 물증에게 신체흔적 키워드가 있다.') }),
  record({ id: 'L001-E-11', originalFamilyId: 'L001-E-11', archive: 'evidence', stage: 2, recordType: 'relation', fields: ['suspect', 'evidence'], icons: ['범인+물증', '숙련'], textKo: '범인은 핵심 물증을 업무상 다룰 수 있었다.', evidenceValue: 2, predicate: relationPredicate('suspect_evidence', 2, '범인은 핵심 물증을 다룰 수 있었다.') }),
  record({ id: 'L001-E-12', originalFamilyId: 'L001-E-12', archive: 'evidence', stage: 2, recordType: 'relation', fields: ['place', 'evidence'], icons: ['장소+물증', '관리'], textKo: '핵심 물증은 사건 장소의 관리 체계에 포함된다.', evidenceValue: 2, predicate: relationPredicate('place_evidence', 2, '핵심 물증은 사건 장소 또는 인접 구역에서 구할 수 있었다.') }),

  record({ id: 'L001-T-01', originalFamilyId: 'L001-T-01', archive: 'time', stage: 1, recordType: 'single', fields: ['time'], icons: ['시간', '출입금지'], textKo: '사건 시간대에는 외부 방문객 출입이 불가능했다.', evidenceValue: 2, predicate: entityPredicate('entityHasTag', 'time', '출입금지', '사건 시간대에게 출입금지 키워드가 있다.') }),
  record({ id: 'L001-T-02', originalFamilyId: 'L001-T-02', archive: 'time', stage: 1, recordType: 'single', fields: ['time'], icons: ['시간', '혼잡X'], textKo: '사건 시간대는 퇴근 혼잡 시간 이후다.', evidenceValue: 1, predicate: entityPredicate('entityLacksTag', 'time', '혼잡', '사건 시간대는 혼잡 태그를 가지지 않는다.') }),
  record({ id: 'L001-T-03', originalFamilyId: 'L001-T-03', archive: 'time', stage: 1, recordType: 'single', fields: ['time'], icons: ['시간', '야간출입'], textKo: '사건 시간대에는 야간 출입 가능 여부가 중요했다.', evidenceValue: 2, predicate: entityPredicate('entityHasTag', 'time', '야간출입', '사건 시간대에게 야간출입 키워드가 있다.') }),
  record({ id: 'L001-T-04', originalFamilyId: 'L001-T-04', archive: 'time', stage: 1, recordType: 'single', fields: ['time'], icons: ['시간', 'CCTV작동X'], textKo: '사건 시간대는 CCTV가 완전 정상 상태라고 보기 어렵다.', evidenceValue: 2, predicate: entityPredicate('entityLacksTag', 'time', 'CCTV작동', '사건 시간대에는 CCTV작동 키워드가 없다.') }),
  record({ id: 'L001-T-05', originalFamilyId: 'L001-T-05', archive: 'time', stage: 1, recordType: 'single', fields: ['time'], icons: ['시간', '혼자'], textKo: '사건 시간대에는 건물 내부 인원이 줄어든 상태였다.', evidenceValue: 1, predicate: entityPredicate('entityHasTag', 'time', '혼자', '사건 시간대는 혼자 태그를 가진다.') }),
  record({ id: 'L001-T-06', originalFamilyId: 'L001-T-06', archive: 'time', stage: 1, recordType: 'single', fields: ['time'], icons: ['시간', '혼자'], textKo: '사건 시간대에는 피해자가 혼자 있었을 가능성이 있다.', evidenceValue: 2, predicate: entityPredicate('entityHasTag', 'time', '혼자', '사건 시간대는 혼자 태그를 가진다.') }),
  record({ id: 'L001-T-07', originalFamilyId: 'L001-T-07', archive: 'time', stage: 1, recordType: 'single', fields: ['time'], icons: ['시간', '감시확인'], textKo: '사건 시간대에는 순찰 또는 감시 체계가 변동되었다.', evidenceValue: 2, predicate: entityPredicate('entityHasTag', 'time', '감시확인', '사건 시간대에게 감시확인 키워드가 있다.') }),
  record({ id: 'L001-T-08', originalFamilyId: 'L001-T-08', archive: 'time', stage: 1, recordType: 'single', fields: ['time'], icons: ['시간', '출입금지'], textKo: '사건 시간대는 정상 방문객 활동 시간이 아니다.', evidenceValue: 2, predicate: entityPredicate('entityHasTag', 'time', '출입금지', '사건 시간대에게 출입금지 키워드가 있다.') }),
  record({ id: 'L001-T-09', originalFamilyId: 'L001-T-09', archive: 'time', stage: 2, recordType: 'single', fields: ['time'], icons: ['시간', '감시확인'], textKo: '사건 시간대에는 일부 감시 기록을 확인 중이었다.', evidenceValue: 3, predicate: entityPredicate('entityHasTag', 'time', '감시확인', '사건 시간대에게 감시확인 키워드가 있다.') }),
  record({ id: 'L001-T-10', originalFamilyId: 'L001-T-10', archive: 'time', stage: 2, recordType: 'single', fields: ['time'], icons: ['시간', '기록비어있음'], textKo: '사건 시간대에는 보안 기록이 비어 있을 수 있었다.', evidenceValue: 3, predicate: entityPredicate('entityHasTag', 'time', '기록비어있음', '사건 시간대에게 기록비어있음 키워드가 있다.') }),
  record({ id: 'L001-T-11', originalFamilyId: 'L001-T-11', archive: 'time', stage: 2, recordType: 'single', fields: ['time'], icons: ['시간', '저밀도'], textKo: '사건 시간대에는 이동 밀도가 낮았다.', evidenceValue: 1, predicate: entityPredicate('entityHasTag', 'time', '혼자', '사건 시간대는 혼자 태그를 가진다.') }),
  record({ id: 'L001-T-12', originalFamilyId: 'L001-T-12', archive: 'time', stage: 2, recordType: 'single', fields: ['time'], icons: ['시간', '교대빈틈X'], textKo: '사건 시간대는 경비 교대 직후의 빈틈 시간은 아니다.', evidenceValue: 1, predicate: entityPredicate('entityLacksTag', 'time', '교대빈틈', '사건 시간대에는 교대빈틈 키워드가 없다.') })
];

function tip(id: string, textKo: string, predicate: Predicate, truth: boolean): UnconfirmedTip {
  return { id, caseId: 'L001', textKo, predicate, truth, auditedByPlayerIds: [] };
}

const LIGHT_TIPS: UnconfirmedTip[] = [
  tip('U-01', '범인은 내부 임직원이라는 제보가 있다.', entityPredicate('entityHasTag', 'suspect', '내부', '범인은 내부 태그를 가진다.'), true),
  tip('U-02', '범인은 협력업체 인력이라는 제보가 있다.', entityPredicate('entityHasTag', 'suspect', '협력', '범인은 협력 태그를 가진다.'), false),
  tip('U-03', '범인은 보안 권한과 관련이 있다는 제보가 있다.', entityPredicate('entityHasTag', 'suspect', '보안', '범인은 보안 태그를 가진다.'), true),
  tip('U-04', '범인은 금전 장부 담당자라는 제보가 있다.', entityPredicate('entityHasTag', 'suspect', '금전', '범인은 금전 태그를 가진다.'), false),
  tip('U-05', '범인은 약품을 취급할 수 있었다는 제보가 있다.', entityPredicate('entityHasTag', 'suspect', '약품', '범인은 약품 태그를 가진다.'), true),
  tip('U-06', '사건 장소는 공개 구역이라는 제보가 있다.', entityPredicate('entityHasTag', 'place', '공개', '사건 장소는 공개 태그를 가진다.'), false),
  tip('U-07', '사건 장소에는 약품이 보관될 수 있다는 제보가 있다.', entityPredicate('entityHasTag', 'place', '약품', '사건 장소는 약품 태그를 가진다.'), true),
  tip('U-08', '사건 장소는 외부 차량 동선과 직접 연결된 곳이라는 제보가 있다.', entityPredicate('entityHasTag', 'place', '외부통로', '사건 장소에게 외부통로 키워드가 있다.'), false),
  tip('U-09', '핵심 물증은 전자기기라는 제보가 있다.', entityPredicate('entityHasTag', 'evidence', '전자', '핵심 물증은 전자 태그를 가진다.'), false),
  tip('U-10', '핵심 물증은 약품이라는 제보가 있다.', entityPredicate('entityHasTag', 'evidence', '약품', '핵심 물증은 약품 태그를 가진다.'), true),
  tip('U-11', '핵심 물증은 전원 없이 사용될 수 있다는 제보가 있다.', entityPredicate('entityHasTag', 'evidence', '전원없음', '핵심 물증에게 전원없음 키워드가 있다.'), true),
  tip('U-12', '핵심 물증은 정비 공구라는 제보가 있다.', entityPredicate('entityHasTag', 'evidence', '공구', '핵심 물증은 공구 태그를 가진다.'), false),
  tip('U-13', '사건 시간대에는 외부 방문객 출입이 불가능했다는 제보가 있다.', entityPredicate('entityHasTag', 'time', '출입금지', '사건 시간대에게 출입금지 키워드가 있다.'), true),
  tip('U-14', '사건 시간대에는 CCTV가 정상 운영 중이었다는 제보가 있다.', entityPredicate('entityHasTag', 'time', 'CCTV작동', '사건 시간대에게 CCTV작동 키워드가 있다.'), false),
  tip('U-15', '범인은 핵심 물증을 업무상 다룰 수 있었다는 제보가 있다.', relationPredicate('suspect_evidence', 2, '범인은 핵심 물증을 다룰 수 있었다.'), true),
  tip('U-16', '핵심 물증은 사건 장소의 관리 체계에 포함된 물건이라는 제보가 있다.', relationPredicate('place_evidence', 2, '핵심 물증은 사건 장소 또는 인접 구역에서 구할 수 있었다.'), true)
];

function recordsToMap(records: NotarizedRecord[]): Record<string, NotarizedRecord> {
  return Object.fromEntries(records.map((item) => [item.id, { ...item }]));
}

function recordsToArchives(records: NotarizedRecord[]): Record<Archive, string[]> {
  return {
    people: records.filter((item) => item.archive === 'people').map((item) => item.id),
    space: records.filter((item) => item.archive === 'space').map((item) => item.id),
    evidence: records.filter((item) => item.archive === 'evidence').map((item) => item.id),
    time: records.filter((item) => item.archive === 'time').map((item) => item.id)
  };
}

function officialTagsFor(candidates: Candidate[]): string[] {
  const recordTags = LIGHT_RECORDS.flatMap((record) =>
    record.predicate.type === 'entityHasTag' || record.predicate.type === 'entityLacksTag' ? [record.predicate.tag] : []
  );
  return Array.from(new Set([...ALL_CANDIDATES.flatMap((candidate) => candidate.tags), ...recordTags, '전원없음', 'CCTV작동'])).sort();
}

function solutionCandidate(candidates: Candidate[], solution: CaseSolution, field: CaseField): Candidate {
  const id = solution[`${field}Id` as keyof CaseSolution];
  const candidate = candidates.find((item) => item.id === id);
  if (!candidate) throw new Error(`Missing solution candidate for ${field}`);
  return candidate;
}

function generateExtraRecords(mode: GameMode, candidates: Candidate[], baseRecords: NotarizedRecord[]): NotarizedRecord[] {
  const config = MODE_CONFIGS[mode];
  const records = [...baseRecords.map((item) => ({ ...item }))];
  const perArchiveTarget = config.recordsPerArchive;
  const solutionTags: Record<CaseField, string[]> = {
    suspect: solutionCandidate(candidates, L001_SOLUTION, 'suspect').tags,
    place: solutionCandidate(candidates, L001_SOLUTION, 'place').tags,
    evidence: solutionCandidate(candidates, L001_SOLUTION, 'evidence').tags,
    time: solutionCandidate(candidates, L001_SOLUTION, 'time').tags
  };
  const fieldArchive: Record<CaseField, Archive> = { suspect: 'people', place: 'space', evidence: 'evidence', time: 'time' };
  const archiveField: Record<Archive, CaseField> = { people: 'suspect', space: 'place', evidence: 'evidence', time: 'time' };
  const negativeTags: Record<CaseField, string[]> = {
    suspect: ['외부', '금전', '협력', '언론'],
    place: ['공개', '외부통로', '문서'],
    evidence: ['전자', '공구', '회사물품'],
    time: ['혼잡', 'CCTV작동', '교대빈틈']
  };
  const relationByArchive: Record<Archive, RelationType[]> = {
    people: ['suspect_place', 'suspect_evidence', 'suspect_time'],
    space: ['suspect_place', 'place_evidence', 'place_time'],
    evidence: ['suspect_evidence', 'place_evidence'],
    time: ['place_time', 'suspect_time']
  };
  for (const archive of ARCHIVES) {
    let localIndex = records.filter((item) => item.archive === archive).length + 1;
    while (records.filter((item) => item.archive === archive).length < perArchiveTarget) {
      const field = archiveField[archive];
      const useRelation = localIndex % 3 === 0 && config.allowedRelationTypes.some((relation) => relationByArchive[archive].includes(relation));
      const family = `L001-${archive.toUpperCase().slice(0, 2)}-X${String(localIndex).padStart(2, '0')}`;
      if (useRelation) {
        const relationType = config.allowedRelationTypes.find((relation) => relationByArchive[archive].includes(relation)) ?? 'suspect_place';
        const threshold: 2 | 3 = config.allowStrongRelationClaims && localIndex % 6 === 0 ? 3 : 2;
        records.push(record({
          id: `${family}`,
          originalFamilyId: family,
          archive,
          stage: localIndex <= 14 ? 2 : 3,
          recordType: 'relation',
          fields: [...RELATION_FIELDS[relationType]],
          icons: [RELATION_LABELS[relationType], threshold === 3 ? '강한 연결' : '연결'],
          textKo: `${RELATION_LABELS[relationType]} 연결은 사건 흐름과 잘 맞아떨어진다.`,
          evidenceValue: threshold === 3 ? 3 : 2,
          predicate: relationPredicate(relationType, threshold, `${RELATION_LABELS[relationType]} 연결이 ${threshold === 3 ? '매우 강하다' : '충분히 자연스럽다'}.`)
        }));
      } else {
        const tagPool = localIndex % 4 === 0 ? negativeTags[field] : solutionTags[field];
        const tag = tagPool[(localIndex - 1) % tagPool.length];
        const hasTag = solutionTags[field].includes(tag);
        records.push(record({
          id: `${family}`,
          originalFamilyId: family,
          archive: fieldArchive[field],
          stage: localIndex <= 14 ? 2 : 3,
          recordType: 'single',
          fields: [field],
          icons: [field, hasTag ? tag : `${tag}X`],
          textKo: `${field === 'evidence' ? '핵심 물증' : field === 'suspect' ? '범인' : field === 'place' ? '사건 장소' : '사건 시간대'}은 ${hasTag ? `[${tag}] 특징이 있다` : `[${tag}] 특징으로 보기 어렵다`}.`,
          evidenceValue: localIndex % 5 === 0 ? 3 : localIndex % 2 === 0 ? 2 : 1,
          predicate: entityPredicate(hasTag ? 'entityHasTag' : 'entityLacksTag', field, tag, `${field} ${hasTag ? 'has' : 'lacks'} ${tag}`)
        }));
      }
      localIndex += 1;
    }
  }
  return records;
}

export function buildCaseEnvelope(mode: GameMode, caseEnvelopeId = `L001-${mode}`): CaseEnvelope {
  const candidates = ALL_CANDIDATES.filter((candidate) => candidate.activeInModes.includes(mode)).map((item) => ({ ...item, tags: [...item.tags] }));
  const relationScores = buildRelationScores(candidates);
  const records = mode === 'light' ? LIGHT_RECORDS.map((item) => ({ ...item })) : generateExtraRecords(mode, candidates, LIGHT_RECORDS);
  const tips = MODE_CONFIGS[mode].usesTips ? LIGHT_TIPS.map((item) => ({ ...item, auditedByPlayerIds: [] })) : [];
  return {
    id: caseEnvelopeId,
    caseId: 'L001',
    mode,
    titleKo: mode === 'light' ? '실험실의 공백 기록 - 라이트' : `실험실의 공백 기록 - ${MODE_CONFIGS[mode].nameKo}`,
    descriptionKo:
      '헬릭스 타워의 내부 조사관은 연구 자료 검토를 앞둔 밤, 실험실 인근에서 의식을 잃은 채 발견되었다. 조사관이 확인하던 기밀 연구 파일 일부는 사라졌고, 사건 시간대의 일부 감시 기록에는 설명하기 어려운 빈칸이 남아 있었다.',
    solution: { ...L001_SOLUTION },
    candidates,
    officialTags: officialTagsFor(candidates),
    relationScores,
    records: recordsToMap(records),
    archives: recordsToArchives(records),
    tips: Object.fromEntries(tips.map((item) => [item.id, item])),
    tipDeck: tips.map((item) => item.id)
  };
}

export function listCaseEnvelopeOptions(mode: GameMode): Array<{ id: string; titleKo: string; warningKo: string }> {
  return [
    {
      id: `L001-${mode}`,
      titleKo: mode === 'light' ? '실험실의 공백 기록 - 라이트' : `실험실의 공백 기록 - ${MODE_CONFIGS[mode].nameKo}`,
      warningKo: '이 사건을 이미 플레이한 그룹은 정답을 알고 있을 수 있습니다. 같은 사건의 더 어려운 모드를 다시 할 때는 주의하세요.'
    }
  ];
}

export function recordsByArchive(records: Record<string, NotarizedRecord>, archive: Archive): NotarizedRecord[] {
  return Object.values(records).filter((record) => record.archive === archive);
}

export function fieldCandidates(candidates: Candidate[], field: CaseField): Candidate[] {
  return candidates.filter((candidate) => candidate.field === field);
}

export function getSolutionCandidate(candidates: Candidate[], solution: CaseSolution, field: CaseField): Candidate {
  return solutionCandidate(candidates, solution, field);
}
