import { useMemo, useState, type ReactNode } from 'react';
import {
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  KeyRound,
  MapPinned,
  MessageSquareText,
  Radio,
  Target,
  X
} from 'lucide-react';
import { FIELD_LABELS, MODE_CONFIGS, PHASE_LABELS } from '../model/constants';
import type { GamePhase, GameState } from '../model/types';

type Props = {
  state?: GameState | null;
  onClose: () => void;
};

type TutorialStep = {
  kicker: string;
  title: string;
  icon: ReactNode;
  body: string;
  beats: string[];
  visual: ReactNode;
};

const phaseGuides: Record<GamePhase, { title: string; body: string; beats: string[] }> = {
  setup: {
    title: '게임 설정',
    body: '처음이라면 라이트 모드, 인간 1명, 나머지 AI로 시작하세요. 흐름을 가장 빨리 볼 수 있습니다.',
    beats: ['라이트는 규칙 카드와 개인 목표가 빠진 입문 모드', '사건 파일 L001-light 권장', '후보 20개와 공식 기록 48장으로 진행']
  },
  archiveSelection: {
    title: '방문지 선택',
    body: '이번 라운드에 어디로 갈지 고릅니다. 정보실은 공식 기록을, 지원 데스크와 확인소는 복사본 제작과 제보 확인을 도와줍니다.',
    beats: ['1~2명 방문: 2장 보고 1장 선택', '3명 이상 방문: 가격 제안으로 1장 가져가기', '지원 데스크: 자금, 복사본, 제보 확인']
  },
  archiveResolution: {
    title: '정보 확인',
    body: '여기서 얻는 공식 기록은 마지막에 점수가 되는 증거입니다. 기록 내용은 가진 사람에게만 완전한 가치가 있습니다.',
    beats: ['비공개로 얻은 기록 내용은 공개 로그에 나오지 않음', '사람이 몰리면 공개 후 가격 제안', '버린 기록은 다시 돌아오지 않음']
  },
  market: {
    title: '시장 거래',
    body: '이 게임의 중심입니다. 정답을 아는 것보다, 그 정답을 뒷받침할 기록과 이용권을 어떻게 배치하느냐가 중요합니다.',
    beats: ['기록 판매: 소유권 이전', '증거 이용권: 마지막 제출에 1회 빌려 쓰는 권리', '제보와 소문은 거래되지만 공식 증거는 아님']
  },
  publicClaim: {
    title: '공개 주장',
    body: '모두 앞에서 베팅을 걸고 주장을 남깁니다. 바로 정답인지 알려주지 않기 때문에 압박과 정보전이 됩니다.',
    beats: ['자유 입력 없이 공식 키워드로 선택', '라이트는 1코인 고정', '게임 종료 때 참/거짓 점수 계산']
  },
  lawAuction: {
    title: '규칙 카드 처리',
    body: '상위 모드에서는 시장의 규칙 자체가 바뀝니다. 기록 점수, 이용권 보너스, 공개 주장 보상이 달라질 수 있습니다.',
    beats: ['라이트와 스탠다드 기본은 숨김', '익스트림은 2, 4라운드 후 가격 제안', '같은 종류의 규칙 카드는 교체']
  },
  finalSubmission: {
    title: '최종 제출',
    body: '범인, 장소, 핵심 물증, 시간대를 고르고 공식 기록이나 증거 이용권을 붙입니다. 같은 원본 묶음 번호는 한 번만 점수화됩니다.',
    beats: ['제보와 소문은 붙일 수 없음', '연결 단서는 관련 답을 모두 맞혀야 점수', '정답과 증거가 함께 있어야 고득점']
  },
  gameOver: {
    title: '점수 공개',
    body: '정답, 증거, 공개 주장, 이용권 보너스, 코인, 벌점을 합산합니다. 누가 정보를 잘 사고팔았는지 확인하는 장면입니다.',
    beats: ['정답 4개 보너스 포함 최대 28점', '공식 기록이 추가 점수의 핵심', '이용권을 빌려준 사람도 보너스를 받을 수 있음']
  }
};

function FlowNode({ icon, label, tone = 'default' }: { icon: ReactNode; label: string; tone?: 'default' | 'gold' }) {
  return (
    <span className={`tutorial-flow-node ${tone}`}>
      {icon}
      <b>{label}</b>
    </span>
  );
}

function FlowArrow() {
  return <span className="tutorial-flow-arrow">→</span>;
}

export default function TutorialOverlay({ state, onClose }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const config = state ? MODE_CONFIGS[state.mode] : MODE_CONFIGS.light;
  const phase = state?.phase ?? 'setup';
  const phaseGuide = phaseGuides[phase];

  const steps = useMemo<TutorialStep[]>(() => [
    {
      kicker: '목표',
      title: '정답을 맞히고, 그 답을 뒷받침할 증거를 모으세요',
      icon: <Target size={34} />,
      body: '마지막에는 네 가지 답을 제출합니다. 하지만 높은 점수를 얻으려면 그 답을 받쳐 줄 공식 기록이나 증거 이용권도 가지고 있어야 합니다.',
      beats: ['정답 점수는 기본 점수', '공식 기록은 추가 점수', '거래가 역전 수단'],
      visual: (
        <div className="tutorial-score-rig">
          <FlowNode icon={<Target size={18} />} label="정답 추리" />
          <FlowArrow />
          <FlowNode icon={<FileCheck2 size={18} />} label="공식 기록" tone="gold" />
          <FlowArrow />
          <FlowNode icon={<CircleDollarSign size={18} />} label="거래" />
        </div>
      )
    },
    {
      kicker: '추리 보드',
      title: '네 줄의 후보를 하나씩 줄여 갑니다',
      icon: <MapPinned size={34} />,
      body: '추리 보드는 게임 안의 메모장입니다. 후보를 클릭해 정보를 보고, 더블클릭으로 가능, 보류, 제외를 표시하세요.',
      beats: [`${FIELD_LABELS.suspect}, ${FIELD_LABELS.place}, ${FIELD_LABELS.evidence}, ${FIELD_LABELS.time}`, '키워드가 단서의 언어', '표시는 내 메모이며 점수에는 직접 반영되지 않음'],
      visual: (
        <div className="tutorial-lanes">
          {(['suspect', 'place', 'evidence', 'time'] as const).map((field, index) => (
            <span key={field} className={`tutorial-lane lane-${index}`}>{FIELD_LABELS[field]}</span>
          ))}
        </div>
      )
    },
    {
      kicker: '공식 기록',
      title: '공식 기록은 점수가 되는 정보입니다',
      icon: <FileCheck2 size={34} />,
      body: '공식 기록은 실제 사건과 맞는 카드입니다. 기록마다 원본 묶음 번호와 증거 점수가 있고, 마지막 제출 때 붙이면 점수가 됩니다.',
      beats: ['원본: 기본 기록', '공식 복사본: 원본보다 약하지만 점수 가능', '같은 원본 묶음 번호는 한 번만 점수화'],
      visual: (
        <div className="tutorial-record-card">
          <span>[공식] [원본] [증거 점수 3]</span>
          <strong>범인은 약품을 다룰 수 있었다.</strong>
          <small>원본 묶음 L001-P-09</small>
        </div>
      )
    },
    {
      kicker: '이용권',
      title: '기록을 팔 수도 있고, 한 번만 빌려줄 수도 있습니다',
      icon: <KeyRound size={34} />,
      body: '기록 판매는 카드를 넘기는 일입니다. 증거 이용권은 카드를 넘기지 않고, 마지막 제출에 한 번 쓸 권리만 빌려주는 일입니다.',
      beats: ['판매자는 카드를 잃고 코인을 얻음', '이용권은 한 번 제출용', '상대가 점수를 얻으면 빌려준 사람도 보너스 가능'],
      visual: (
        <div className="tutorial-contract-flow">
          <FlowNode icon={<FileCheck2 size={18} />} label="기록 보유" tone="gold" />
          <FlowArrow />
          <FlowNode icon={<KeyRound size={18} />} label="이용권 발급" />
          <FlowArrow />
          <FlowNode icon={<ClipboardCheck size={18} />} label="최종 제출" />
        </div>
      )
    },
    {
      kicker: '제보와 소문',
      title: '제보와 소문은 힌트지만, 증거는 아닙니다',
      icon: <Radio size={34} />,
      body: '확인 안 된 제보와 소문은 맞을 수도 틀릴 수도 있습니다. 사고팔 수는 있지만 마지막 증거 칸에는 넣을 수 없습니다.',
      beats: ['확인하면 나만 참/거짓을 봄', '확인 결과는 공개 로그에 나오지 않음', '최종 제출 화면에는 증거 후보로 나오지 않음'],
      visual: (
        <div className="tutorial-tip-card">
          <span>[확인 안 된 제보]</span>
          <strong>핵심 물증은 약품이라는 말이 있다.</strong>
          <small>공식 증거 아님</small>
        </div>
      )
    },
    {
      kicker: '라운드 흐름',
      title: '방문지 선택, 거래, 공개 주장을 반복합니다',
      icon: <BookOpenCheck size={34} />,
      body: '처음에는 모든 룰을 외우지 않아도 됩니다. 어디서 정보를 얻고, 무엇을 팔거나 빌려주고, 어떤 주장을 공개할지만 고르면 됩니다.',
      beats: ['정보실에서 공식 기록 획득', '시장에서 기록, 복사본, 이용권, 제보 거래', '공개 주장으로 베팅과 압박'],
      visual: (
        <div className="tutorial-round-loop">
          <FlowNode icon={<MapPinned size={18} />} label="정보실" />
          <FlowArrow />
          <FlowNode icon={<CircleDollarSign size={18} />} label="시장" tone="gold" />
          <FlowArrow />
          <FlowNode icon={<MessageSquareText size={18} />} label="공개 주장" />
        </div>
      )
    },
    {
      kicker: '현재 화면',
      title: phaseGuide.title,
      icon: <GraduationCap size={34} />,
      body: phaseGuide.body,
      beats: phaseGuide.beats,
      visual: (
        <div className="tutorial-phase-console">
          <span>{state ? state.caseEnvelopeId : 'L001-light'}</span>
          <strong>{state ? PHASE_LABELS[state.phase] : '새 게임 설정'}</strong>
          <small>{config.nameKo} · {config.rounds}라운드 · 공개 주장 {config.claimStakeMin}~{config.claimStakeMax}코인</small>
        </div>
      )
    },
    {
      kicker: '최종 점수',
      title: '아는 것보다, 보여 줄 증거가 있는지가 중요합니다',
      icon: <ClipboardCheck size={34} />,
      body: '정답을 맞힌 항목에만 증거 점수가 붙습니다. 연결 단서는 관련 답을 모두 맞혀야 하며, 같은 원본 묶음은 중복으로 점수화되지 않습니다.',
      beats: ['정답: 항목당 +5, 전부 정답 +8', '증거: 맞힌 항목에 붙인 공식 기록만 점수', '코인, 이용권 보너스, 공개 주장, 벌점 합산'],
      visual: (
        <div className="tutorial-score-grid">
          <span>정답</span>
          <span>증거</span>
          <span>주장</span>
          <span>이용권</span>
          <span>코인</span>
          <span>벌점</span>
        </div>
      )
    }
  ], [config, phaseGuide, state]);

  const current = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <div className="tutorial-backdrop" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <section className="tutorial-modal">
        <button className="tutorial-close" type="button" onClick={onClose} aria-label="튜토리얼 닫기">
          <X size={20} />
        </button>

        <aside className="tutorial-rail">
          <div className="tutorial-rail-title">
            <GraduationCap size={20} />
            <strong>플레이 튜토리얼</strong>
          </div>
          <div className="tutorial-progress" aria-label={`튜토리얼 ${stepIndex + 1}/${steps.length}`}>
            {steps.map((step, index) => (
              <button
                key={step.kicker}
                className={index === stepIndex ? 'active' : ''}
                onClick={() => setStepIndex(index)}
                aria-label={`${index + 1}단계 ${step.title}`}
              >
                <span>{index + 1}</span>
                <b>{step.kicker}</b>
              </button>
            ))}
          </div>
        </aside>

        <main className="tutorial-stage">
          <div className="tutorial-card">
            <div className="tutorial-icon">{current.icon}</div>
            <span className="hud-kicker">{current.kicker}</span>
            <h2 id="tutorial-title">{current.title}</h2>
            <p>{current.body}</p>
            <div className="tutorial-beats">
              {current.beats.map((beat) => <span key={beat}>{beat}</span>)}
            </div>
            <div className="tutorial-visual">{current.visual}</div>
          </div>

          <div className="tutorial-actions">
            <button type="button" onClick={() => setStepIndex((index) => Math.max(0, index - 1))} disabled={isFirst}>
              <ChevronLeft size={18} /> 이전
            </button>
            <span>{stepIndex + 1} / {steps.length}</span>
            {isLast ? (
              <button className="primary" type="button" onClick={onClose}>게임으로 돌아가기</button>
            ) : (
              <button className="primary" type="button" onClick={() => setStepIndex((index) => Math.min(steps.length - 1, index + 1))}>
                다음 <ChevronRight size={18} />
              </button>
            )}
          </div>
        </main>
      </section>
    </div>
  );
}
