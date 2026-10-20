import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from './api-client';
import { BranchService } from './branch.service';

describe('BranchService', () => {
  let service: BranchService;
  let apiMock: {
    list: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    apiMock = {
      list: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [BranchService, { provide: ApiClient, useValue: apiMock }],
    });

    service = TestBed.inject(BranchService);
  });

  it('should deduplicate branches with the same name or id', async () => {
    // Simulate API returning duplicates (e.g. two "Merkez Şube" docs)
    apiMock.list.mockReturnValue(
      of({
        ok: true,
        data: [
          { id: 'b1', name: 'Merkez Şube' },
          { id: 'b2', name: 'Merkez Şube' }, // duplicate name
          { id: 'b1', name: 'Merkez Şube' }, // duplicate id
          { id: 'b3', name: 'Kadıköy Şubesi' },
        ],
      }),
    );

    const branches = await service.ensureBranches();
    expect(branches.length).toBe(2);
    expect(branches.map((b) => b.name)).toEqual(['Merkez Şube', 'Kadıköy Şubesi']);
  });
});
