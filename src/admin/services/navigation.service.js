const NavigationItem = require('../models/NavigationItem');

class NavigationService {
  /**
   * Public: Retrieve active header navigation items
   * - is_active === true
   * - Sorted by display_order ASC, then id ASC (deterministic secondary sort)
   * - Returns only customer-facing fields
   */
  async getActiveHeaderItems() {
    const items = await NavigationItem.findAll({
      where: {
        is_active: true
      },
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC']
      ],
      attributes: ['id', 'label', 'href', 'display_order', 'open_in_new_tab']
    });

    return items;
  }

  /**
   * Admin: List all navigation items (including disabled) with display_order ASC, id ASC
   */
  async listAllItems() {
    const items = await NavigationItem.findAll({
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC']
      ]
    });

    return items;
  }

  /**
   * Admin: Get navigation item by ID
   */
  async getItemById(id) {
    const item = await NavigationItem.findByPk(id);
    return item;
  }

  /**
   * Admin: Create navigation item
   */
  async createItem(data) {
    const item = await NavigationItem.create(data);
    return item;
  }

  /**
   * Admin: Update navigation item fields
   */
  async updateItem(id, data) {
    const item = await NavigationItem.findByPk(id);
    if (!item) {
      return null;
    }

    await item.update(data);
    return item;
  }

  /**
   * Admin: Toggle item active status
   */
  async updateStatus(id, isActive) {
    const item = await NavigationItem.findByPk(id);
    if (!item) {
      return null;
    }

    await item.update({ is_active: isActive });
    return item;
  }

  /**
   * Admin: Delete navigation item
   */
  async deleteItem(id) {
    const item = await NavigationItem.findByPk(id);
    if (!item) {
      return null;
    }

    await item.destroy();
    return true;
  }
}

module.exports = new NavigationService();
