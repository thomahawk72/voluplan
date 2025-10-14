import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('viser tittel og melding når open=true', () => {
    render(
      <ConfirmDialog
        open
        title="Slett kategori"
        message="Er du sikker på at du vil slette denne kategorien?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText('Slett kategori')).toBeInTheDocument();
    expect(screen.getByText('Er du sikker på at du vil slette denne kategorien?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /avbryt/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument();
  });

  it('kaller onCancel når Avbryt klikkes', () => {
    const onCancel = jest.fn();
    render(
      <ConfirmDialog
        open
        title="Bekreft"
        message="Vil du fortsette?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /avbryt/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('kaller onConfirm når OK klikkes', () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmDialog
        open
        title="Bekreft"
        message="Vil du fortsette?"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
