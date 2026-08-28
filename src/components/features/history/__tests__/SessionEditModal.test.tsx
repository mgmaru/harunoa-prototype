/**
 * SessionEditModalのユニットテスト
 *
 * 関連Issue: #22 一時停止を含むセッションを編集・保存すると一時停止時間が加算される
 * 関連Issue: #24 時間表記の用語を「一時停止」に統一
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Session } from '@/types/session';
import { Project } from '@/types/project';
import { SessionEditModal } from '../SessionEditModal';

const MINUTE = 60 * 1000;

const project: Project = {
  id: 'project-1',
  userId: 'user-1',
  name: 'プロジェクトA',
  color: '#3B82F6',
  isArchived: false,
  archivedAt: null,
  createdAt: new Date('2025-01-01T00:00:00'),
  updatedAt: new Date('2025-01-01T00:00:00'),
};

/**
 * 10:00〜10:25の経過時間に対し、計測時間20分（＝一時停止5分）のセッション
 */
const createSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-1',
  userId: 'user-1',
  projectId: project.id,
  startAt: new Date('2025-01-15T10:00:00'),
  endAt: new Date('2025-01-15T10:25:00'),
  durationMs: 20 * MINUTE,
  memo: '',
  isArchived: false,
  archivedAt: null,
  createdAt: new Date('2025-01-15T10:25:00'),
  updatedAt: new Date('2025-01-15T10:25:00'),
  ...overrides,
});

describe('SessionEditModal', () => {
  // jsdomはHTMLDialogElementのshowModal/closeを実装していないため補完する
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function close() {
      this.open = false;
    };
  });

  const onSave = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (session: Session) =>
    render(
      <SessionEditModal
        isOpen
        onClose={onClose}
        onSave={onSave}
        session={session}
        project={project}
      />
    );

  const save = () => fireEvent.click(screen.getByRole('button', { name: '保存' }));

  const durationInputs = () => screen.getAllByRole('spinbutton');

  it('一時停止を含むセッションを変更せずに保存しても計測時間が変わらない', async () => {
    renderModal(createSession());

    save();

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].durationMs).toBe(20 * MINUTE);
  });

  it('終了時刻を延ばした分だけ計測時間が増え、一時停止時間は維持される', async () => {
    renderModal(createSession());

    // 10:25 -> 10:35（経過35分、一時停止5分のため計測時間は30分）
    fireEvent.change(screen.getByLabelText(/終了時刻/), {
      target: { value: '2025-01-15T10:35' },
    });

    expect(durationInputs()[0]).toHaveValue(0);
    expect(durationInputs()[1]).toHaveValue(30);

    save();

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].durationMs).toBe(30 * MINUTE);
  });

  it('計測時間を変更すると一時停止時間を加算した終了時刻が算出される', async () => {
    renderModal(createSession());

    // 計測時間 1時間20分 -> 終了時刻は 10:00 + 1:20 + 一時停止5分 = 11:25
    fireEvent.change(durationInputs()[0], { target: { value: '1' } });

    expect(screen.getByLabelText(/終了時刻/)).toHaveValue('2025-01-15T11:25');

    save();

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].durationMs).toBe(80 * MINUTE);
  });

  it('開始時刻を変更しても計測時間が維持される', async () => {
    renderModal(createSession());

    // 09:00 + 20分 + 一時停止5分 = 09:25
    fireEvent.change(screen.getByLabelText(/開始時刻/), {
      target: { value: '2025-01-15T09:00' },
    });

    expect(screen.getByLabelText(/終了時刻/)).toHaveValue('2025-01-15T09:25');

    save();

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].durationMs).toBe(20 * MINUTE);
  });

  it('一時停止を含むセッションでは一時停止時間を表示する', () => {
    renderModal(createSession());

    expect(screen.getByText(/一時停止/, { selector: 'p' })).toHaveTextContent(
      '一時停止（5分）は計測時間に含まれません'
    );
  });

  it('1分未満の一時停止では注記を表示しない', () => {
    // 経過25分に対し計測時間24分30秒（＝一時停止30秒）
    renderModal(createSession({ durationMs: 24 * MINUTE + 30 * 1000 }));

    expect(
      screen.queryByText(/一時停止/, { selector: 'p' })
    ).not.toBeInTheDocument();
  });

  it('一時停止のないセッションでは注記を表示せず、経過時間をそのまま保存する', async () => {
    renderModal(createSession({ durationMs: 25 * MINUTE }));

    expect(
      screen.queryByText(/一時停止/, { selector: 'p' })
    ).not.toBeInTheDocument();

    save();

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].durationMs).toBe(25 * MINUTE);
  });

  it('一時停止時間を除いた計測時間が1分未満になる場合はエラーを表示する', async () => {
    renderModal(createSession());

    // 経過5分 - 一時停止5分 = 0分
    fireEvent.change(screen.getByLabelText(/終了時刻/), {
      target: { value: '2025-01-15T10:05' },
    });

    save();

    await waitFor(() =>
      expect(
        screen.getByText('計測時間は1分以上を入力してください')
      ).toBeInTheDocument()
    );
    expect(onSave).not.toHaveBeenCalled();
  });
});
