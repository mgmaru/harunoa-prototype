/**
 * ColorPickerのユニットテスト
 *
 * 関連Issue: #12 手動選択時の色重複の可視化
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { COLOR_NAMES, PROJECT_COLORS } from '@/constants/colors';
import { ColorPicker } from '../ColorPicker';

describe('ColorPicker', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('パレットの全色をボタンとして表示する', () => {
    render(<ColorPicker value={null} onChange={onChange} />);

    const buttons = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-label')?.startsWith('色を'));

    expect(buttons).toHaveLength(PROJECT_COLORS.length);
  });

  it('色ボタンのラベルに色名を表示する', () => {
    render(<ColorPicker value={null} onChange={onChange} />);

    expect(
      screen.getByLabelText(`色を${COLOR_NAMES[PROJECT_COLORS[0]]}に設定`)
    ).toBeInTheDocument();
  });

  it('使用済みの色のラベルに使用中を示す', () => {
    const usedColor = PROJECT_COLORS[2];
    render(
      <ColorPicker value={null} onChange={onChange} usedColors={[usedColor]} />
    );

    expect(
      screen.getByLabelText(`色を${COLOR_NAMES[usedColor]}に設定（使用中）`)
    ).toBeInTheDocument();
  });

  it('未使用の色には使用中の表示をしない', () => {
    render(
      <ColorPicker
        value={null}
        onChange={onChange}
        usedColors={[PROJECT_COLORS[2]]}
      />
    );

    expect(
      screen.getByLabelText(`色を${COLOR_NAMES[PROJECT_COLORS[3]]}に設定`)
    ).toBeInTheDocument();
  });

  it('usedColors未指定時はすべて未使用として表示する', () => {
    render(<ColorPicker value={null} onChange={onChange} />);

    const usedButtons = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-label')?.includes('使用中'));

    expect(usedButtons).toHaveLength(0);
  });

  it('使用済みの色でも選択できる', () => {
    const usedColor = PROJECT_COLORS[2];
    render(
      <ColorPicker value={null} onChange={onChange} usedColors={[usedColor]} />
    );

    fireEvent.click(
      screen.getByLabelText(`色を${COLOR_NAMES[usedColor]}に設定（使用中）`)
    );

    expect(onChange).toHaveBeenCalledWith(usedColor);
  });

  it('自動割当オプションは showAutoOption 指定時のみ表示する', () => {
    const { rerender } = render(<ColorPicker value={null} onChange={onChange} />);
    expect(screen.queryByText('自動割当')).not.toBeInTheDocument();

    rerender(<ColorPicker value={null} onChange={onChange} showAutoOption />);
    expect(screen.getByText('自動割当')).toBeInTheDocument();
  });

  it('自動割当のチェックを外すとパレットの先頭色を選択する', () => {
    render(<ColorPicker value={null} onChange={onChange} showAutoOption />);

    fireEvent.click(screen.getByRole('checkbox'));

    expect(onChange).toHaveBeenCalledWith(PROJECT_COLORS[0]);
  });
});
