jest.mock('../../src/modules/categories/categories.repository');

const repository = require('../../src/modules/categories/categories.repository');
const service = require('../../src/modules/categories/categories.service');

describe('categories.service', () => {
  it('lists categories owned by the user', async () => {
    repository.findAllByOwner.mockResolvedValue([{ id: 'cat-1', name: 'Trabalho' }]);

    const categories = await service.list('user-1');

    expect(categories).toHaveLength(1);
    expect(repository.findAllByOwner).toHaveBeenCalledWith('user-1');
  });

  it('throws 404 when the category does not belong to the user', async () => {
    repository.findByIdAndOwner.mockResolvedValue(null);

    await expect(service.getOne('cat-1', 'user-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 404 when updating a category that does not exist', async () => {
    repository.update.mockResolvedValue(null);

    await expect(service.update('cat-1', 'user-1', { name: 'Novo nome' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
