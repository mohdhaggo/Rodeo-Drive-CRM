import { useEffect, useMemo, useState, type FormEvent } from 'react'
import './InspectionList.css'
import inspectionListConfig from './inspectionConfig'

interface InspectionItem {
  id: string
  name: string
  required: boolean
}

interface InspectionSection {
  name: string
  items: InspectionItem[]
}

interface InspectionCategory {
  category: string
  sections: InspectionSection[]
}

const isNonNull = <T,>(value: T | null): value is T => value !== null

const buildId = (label: string): string =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function InspectionList() {
  const [inspectionConfig, setInspectionConfig] = useState<InspectionCategory[]>(() => {
    const stored = localStorage.getItem('inspection_list_config')
    if (stored) {
      try {
        return JSON.parse(stored) as InspectionCategory[]
      } catch {
        return inspectionListConfig as InspectionCategory[]
      }
    }
    return inspectionListConfig as InspectionCategory[]
  })
  const [selectedCategory, setSelectedCategory] = useState(
    inspectionListConfig[0]?.category || ''
  )
  const [selectedSection, setSelectedSection] = useState('')
  const [newSection, setNewSection] = useState('')
  const [itemName, setItemName] = useState('')
  const [isRequired, setIsRequired] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    localStorage.setItem('inspection_list_config', JSON.stringify(inspectionConfig))
    window.dispatchEvent(new Event('inspection-config-updated'))
  }, [inspectionConfig])

  const categoryOptions = useMemo(
    () => inspectionConfig.map((item: InspectionCategory) => item.category),
    [inspectionConfig]
  )

  const sectionOptions = useMemo(() => {
    const category = inspectionConfig.find(
      (item: InspectionCategory) => item.category === selectedCategory
    )
    return category
      ? category.sections.map((section: InspectionSection) => section.name)
      : []
  }, [inspectionConfig, selectedCategory])

  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredConfig = useMemo(() => {
    if (!normalizedSearch) {
      return inspectionConfig
    }

    return inspectionConfig
      .map((category: InspectionCategory) => {
        const filteredSections = category.sections
          .map((section: InspectionSection) => {
            const items = section.items.filter((item: InspectionItem) =>
              item.name.toLowerCase().includes(normalizedSearch)
            )
            if (!items.length) {
              return null
            }
            return { ...section, items }
          })
          .filter(isNonNull)

        if (!filteredSections.length) {
          return null
        }

        return { ...category, sections: filteredSections }
      })
      .filter(isNonNull)
  }, [inspectionConfig, normalizedSearch])

  const totalItems = useMemo(
    () =>
      inspectionConfig.reduce(
        (total: number, category: InspectionCategory) =>
          total +
          category.sections.reduce(
            (sum: number, section: InspectionSection) => sum + section.items.length,
            0
          ),
        0
      ),
    [inspectionConfig]
  )

  const requiredCount = useMemo(
    () =>
      inspectionConfig.reduce(
        (total: number, category: InspectionCategory) =>
          total +
          category.sections.reduce(
            (sum: number, section: InspectionSection) =>
              sum + section.items.filter((item: InspectionItem) => item.required).length,
            0
          ),
        0
      ),
    [inspectionConfig]
  )

  const handleAddItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedItem = itemName.trim()
    if (!trimmedItem) {
      return
    }

    const isNewSection = selectedSection === '__new__'
    const targetSectionName = isNewSection ? newSection.trim() : selectedSection

    if (!targetSectionName) {
      return
    }

    setInspectionConfig((prev) =>
      prev.map((category: InspectionCategory) => {
        if (category.category !== selectedCategory) return category

        const updatedSections = category.sections.map((section: InspectionSection) => {
          if (section.name !== targetSectionName) return section

          return {
            ...section,
            items: [
              ...section.items,
              {
                id: buildId(`${targetSectionName}-${trimmedItem}-${Date.now()}`),
                name: trimmedItem,
                required: isRequired
              }
            ]
          }
        })

        if (
          !updatedSections.some(
            (section: InspectionSection) => section.name === targetSectionName
          )
        ) {
          updatedSections.push({
            name: targetSectionName,
            items: [
              {
                id: buildId(`${targetSectionName}-${trimmedItem}-${Date.now()}`),
                name: trimmedItem,
                required: isRequired
              }
            ]
          })
        }

        return { ...category, sections: updatedSections }
      })
    )

    setItemName('')
    setIsRequired(true)
    setSelectedSection('')
    setNewSection('')
  }

  const updateRequirement = (
    categoryName: string,
    sectionName: string,
    itemId: string,
    required: boolean
  ) => {
    setInspectionConfig((prev) =>
      prev.map((category: InspectionCategory) => {
        if (category.category !== categoryName) return category

        return {
          ...category,
          sections: category.sections.map((section: InspectionSection) => {
            if (section.name !== sectionName) return section

            return {
              ...section,
              items: section.items.map((item: InspectionItem) =>
                item.id === itemId ? { ...item, required } : item
              )
            }
          })
        }
      })
    )
  }

  const removeItem = (categoryName: string, sectionName: string, itemId: string) => {
    setInspectionConfig((prev) =>
      prev.map((category: InspectionCategory) => {
        if (category.category !== categoryName) return category

        return {
          ...category,
          sections: category.sections
            .map((section: InspectionSection) => {
              if (section.name !== sectionName) return section
              return {
                ...section,
                items: section.items.filter((item: InspectionItem) => item.id !== itemId)
              }
            })
            .filter((section: InspectionSection) => section.items.length > 0)
        }
      })
    )
  }

  return (
    <div className="inspection-list">
      <header className="inspection-list-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Inspection List Control</h1>
          <p className="subtitle">
            Manage inspection items by category, section, and required level.
          </p>
        </div>
        <div className="stats">
          <div className="stat-card">
            <span className="stat-label">Total Items</span>
            <span className="stat-value">{totalItems}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Mandatory</span>
            <span className="stat-value">{requiredCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Optional</span>
            <span className="stat-value">{totalItems - requiredCount}</span>
          </div>
        </div>
      </header>

      <section className="inspection-list-controls">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search inspection items"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <form className="add-item-form" onSubmit={handleAddItem}>
          <div className="form-row">
            <label>
              Category
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                {categoryOptions.map((category: string) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Section
              <select
                value={selectedSection}
                onChange={(event) => setSelectedSection(event.target.value)}
              >
                <option value="">Select section</option>
                {sectionOptions.map((section: string) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
                <option value="__new__">Add new section</option>
              </select>
            </label>

            {selectedSection === '__new__' && (
              <label>
                New section name
                <input
                  type="text"
                  placeholder="Enter new section"
                  value={newSection}
                  onChange={(event) => setNewSection(event.target.value)}
                />
              </label>
            )}
          </div>

          <div className="form-row">
            <label className="grow">
              Item name
              <input
                type="text"
                placeholder="Enter inspection item"
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
              />
            </label>

            <label>
              Required
              <select
                value={isRequired ? 'required' : 'optional'}
                onChange={(event) => setIsRequired(event.target.value === 'required')}
              >
                <option value="required">Mandatory</option>
                <option value="optional">Optional</option>
              </select>
            </label>

            <button type="submit" className="primary-btn">
              <i className="fas fa-plus"></i> Add item
            </button>
          </div>
        </form>
      </section>

      <section className="inspection-list-content">
        {filteredConfig.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-search"></i>
            <p>No matching inspection items found.</p>
          </div>
        )}

        {filteredConfig.map((category: InspectionCategory) => (
          <div key={category.category} className="category-card">
            <div className="category-header">
              <div>
                <h2>{category.category}</h2>
                <p>{category.sections.length} sections</p>
              </div>
              <span className="pill">
                {category.sections.reduce(
                  (sum: number, section: InspectionSection) => sum + section.items.length,
                  0
                )}{' '}
                items
              </span>
            </div>

            <div className="section-list">
              {category.sections.map((section: InspectionSection) => (
                <details key={section.name} className="section-item" open>
                  <summary>
                    <span>{section.name}</span>
                    <span className="section-meta">
                      {section.items.length} items
                    </span>
                  </summary>
                  <div className="items-grid">
                    {section.items.map((item: InspectionItem) => (
                      <div key={item.id} className="item-row">
                        <div>
                          <p className="item-name">{item.name}</p>
                          <span className={`badge ${item.required ? 'required' : 'optional'}`}>
                            {item.required ? 'Mandatory' : 'Optional'}
                          </span>
                        </div>
                        <div className="item-actions">
                          <select
                            value={item.required ? 'required' : 'optional'}
                            onChange={(event) =>
                              updateRequirement(
                                category.category,
                                section.name,
                                item.id,
                                event.target.value === 'required'
                              )
                            }
                          >
                            <option value="required">Mandatory</option>
                            <option value="optional">Optional</option>
                          </select>
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => removeItem(category.category, section.name, item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

export default InspectionList
