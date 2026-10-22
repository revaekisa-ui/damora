import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CategoryManager from './CategoryManager';

describe('CategoryManager', () => {
    it('keeps Enter edits local and preserves input focus until changes are explicitly saved', () => {
        const saveChanges = vi.fn();

        const Harness = () => {
            const [categories, setCategories] = useState(['Lama']);
            const [inputValue, setInputValue] = useState('');
            const [editingValue, setEditingValue] = useState<string | null>(null);
            const [hasChanges, setHasChanges] = useState(false);

            return (
                <CategoryManager
                    title="Kategori"
                    categories={categories}
                    inputValue={inputValue}
                    onInputChange={setInputValue}
                    onAddOrUpdate={() => {
                        setCategories(current => current.map(category => category === editingValue ? inputValue : category));
                        setEditingValue(null);
                        setInputValue('');
                        setHasChanges(true);
                    }}
                    onEdit={category => {
                        setEditingValue(category);
                        setInputValue(category);
                    }}
                    onDelete={() => undefined}
                    onMove={() => undefined}
                    editingValue={editingValue}
                    onCancelEdit={() => {
                        setEditingValue(null);
                        setInputValue('');
                    }}
                    hasChanges={hasChanges}
                    isSaving={false}
                    onSaveChanges={saveChanges}
                    placeholder="Nama kategori"
                    suggestedDefaults={['Saran']}
                    onAddSuggested={() => {
                        setCategories(current => [...current, 'Saran']);
                        setHasChanges(true);
                    }}
                />
            );
        };

        render(<Harness />);
        fireEvent.click(screen.getByTitle('Edit'));
        const input = screen.getByLabelText('Nama kategori') as HTMLInputElement;
        input.focus();
        fireEvent.change(input, { target: { value: 'Baru' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(document.activeElement).toBe(input);
        expect(screen.getByText('Baru')).toBeTruthy();
        expect(saveChanges).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Simpan perubahan' }));
        expect(saveChanges).toHaveBeenCalledOnce();
    });

    it('shows and stages only default suggestions that are still missing', () => {
        const addSuggested = vi.fn();
        render(
            <CategoryManager
                title="Kategori"
                categories={['Sudah ada']}
                inputValue=""
                onInputChange={() => undefined}
                onAddOrUpdate={() => undefined}
                onEdit={() => undefined}
                onDelete={() => undefined}
                onMove={() => undefined}
                editingValue={null}
                onCancelEdit={() => undefined}
                hasChanges={false}
                isSaving={false}
                onSaveChanges={() => undefined}
                placeholder="Nama kategori"
                suggestedDefaults={['Sudah ada', 'Saran baru']}
                onAddSuggested={addSuggested}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: '+ Tambah dari saran default (1)' }));
        expect(addSuggested).toHaveBeenCalledOnce();
    });
});