import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import renderWithProvider from '#app/util/test/renderWithProvider';
import { strings } from '../../../../../locales/i18n';
import { collectiblesTestIds } from '#app/components/UI/Collectibles/Collectibles.testIds';
import { PacksScreen } from './PacksScreen';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('#app/components/UI/Collectibles/hooks/usePacksCatalog', () => ({
  usePacksCatalog: () => ({ packs: [], categories: [], isPending: true }),
}));

describe('PacksScreen', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
  });

  it('shows the Packs header and the packs view', () => {
    renderWithProvider(<PacksScreen />);

    expect(
      screen.getByText(strings('collectibles.landing.packs')),
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId(collectiblesTestIds.packsSkeleton),
    ).toBeOnTheScreen();
  });

  it('goes back when the back button is pressed', () => {
    renderWithProvider(<PacksScreen />);

    fireEvent.press(screen.getByTestId(collectiblesTestIds.packsBackButton));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
