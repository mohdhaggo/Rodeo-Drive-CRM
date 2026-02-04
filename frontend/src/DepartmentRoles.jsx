import React, { useMemo, useState } from 'react'
import './DepartmentRoles.css'

const initialDepartments = [
  {
    id: 1,
    name: 'Human Resources',
    description:
      'Responsible for recruitment, employee relations, and benefits administration. Manages talent acquisition, employee development, compensation, and compliance with labor laws.',
    roles: [
      {
        id: 101,
        name: 'HR Manager',
        description:
          'Oversees HR operations and strategy, manages HR team, develops HR policies',
      },
      {
        id: 102,
        name: 'Recruitment Specialist',
        description:
          'Handles talent acquisition, screening candidates, coordinating interviews',
      },
      {
        id: 103,
        name: 'Training Coordinator',
        description:
          'Organizes employee training programs, develops training materials',
      },
    ],
  },
  {
    id: 2,
    name: 'Engineering',
    description:
      'Designs, develops, and maintains software products and solutions. Focuses on creating scalable, efficient, and reliable technology platforms.',
    roles: [
      {
        id: 201,
        name: 'Software Engineer',
        description:
          'Develops and maintains software applications, writes clean code, performs code reviews',
      },
      {
        id: 202,
        name: 'DevOps Engineer',
        description:
          'Manages infrastructure, deployment pipelines, and automation tools',
      },
      {
        id: 203,
        name: 'QA Engineer',
        description:
          'Ensures software quality through testing, creates test plans, reports bugs',
      },
      {
        id: 204,
        name: 'System Architect',
        description:
          'Designs system architecture, technical solutions, and integration patterns',
      },
    ],
  },
  {
    id: 3,
    name: 'Marketing',
    description:
      'Promotes products and builds brand awareness through various channels. Drives customer acquisition and retention through strategic campaigns.',
    roles: [
      {
        id: 301,
        name: 'Marketing Manager',
        description:
          'Develops marketing strategies, manages campaigns, analyzes market trends',
      },
      {
        id: 302,
        name: 'Content Specialist',
        description:
          'Creates engaging content for websites, blogs, and social media',
      },
      {
        id: 303,
        name: 'SEO Analyst',
        description:
          'Optimizes website for search engines, performs keyword research, analyzes traffic',
      },
    ],
  },
]

export default function DepartmentRoles() {
  const [departments, setDepartments] = useState(initialDepartments)
  const [activeModal, setActiveModal] = useState(null)
  const [formState, setFormState] = useState({
    id: null,
    name: '',
    description: '',
    deptId: null,
  })

  const stats = useMemo(() => {
    const totalDepartments = departments.length
    const totalRoles = departments.reduce(
      (acc, dept) => acc + dept.roles.length,
      0
    )
    const avgRoles = totalDepartments
      ? (totalRoles / totalDepartments).toFixed(1)
      : '0'
    return { totalDepartments, totalRoles, avgRoles }
  }, [departments])

  const openModal = (type, payload = {}) => {
    setFormState({
      id: payload.id ?? null,
      name: payload.name ?? '',
      description: payload.description ?? '',
      deptId: payload.deptId ?? null,
    })
    setActiveModal(type)
  }

  const closeModal = () => {
    setActiveModal(null)
    setFormState({ id: null, name: '', description: '', deptId: null })
  }

  const handleDepartmentSubmit = (event) => {
    event.preventDefault()
    if (!formState.name.trim()) return

    if (activeModal === 'addDepartment') {
      const nextId =
        departments.length > 0
          ? Math.max(...departments.map((dept) => dept.id)) + 1
          : 1
      setDepartments([
        ...departments,
        {
          id: nextId,
          name: formState.name,
          description: formState.description,
          roles: [],
        },
      ])
    }

    if (activeModal === 'editDepartment') {
      setDepartments((prev) =>
        prev.map((dept) =>
          dept.id === formState.id
            ? {
                ...dept,
                name: formState.name,
                description: formState.description,
              }
            : dept
        )
      )
    }

    closeModal()
  }

  const handleRoleSubmit = (event) => {
    event.preventDefault()
    if (!formState.name.trim()) return

    if (activeModal === 'addRole') {
      const allRoleIds = departments.flatMap((dept) =>
        dept.roles.map((role) => role.id)
      )
      const nextRoleId = allRoleIds.length
        ? Math.max(...allRoleIds) + 1
        : 101

      setDepartments((prev) =>
        prev.map((dept) =>
          dept.id === formState.deptId
            ? {
                ...dept,
                roles: [
                  ...dept.roles,
                  {
                    id: nextRoleId,
                    name: formState.name,
                    description: formState.description,
                  },
                ],
              }
            : dept
        )
      )
    }

    if (activeModal === 'editRole') {
      setDepartments((prev) =>
        prev.map((dept) =>
          dept.id === formState.deptId
            ? {
                ...dept,
                roles: dept.roles.map((role) =>
                  role.id === formState.id
                    ? {
                        ...role,
                        name: formState.name,
                        description: formState.description,
                      }
                    : role
                ),
              }
            : dept
        )
      )
    }

    closeModal()
  }

  const deleteDepartment = (deptId) => {
    setDepartments((prev) => prev.filter((dept) => dept.id !== deptId))
  }

  const deleteRole = (deptId, roleId) => {
    setDepartments((prev) =>
      prev.map((dept) =>
        dept.id === deptId
          ? {
              ...dept,
              roles: dept.roles.filter((role) => role.id !== roleId),
            }
          : dept
      )
    )
  }

  return (
    <div className="dept-role-container">
      <header className="dept-role-header">
        <h1>🏢 Department & Role Management</h1>
        <p>
          Create departments, add roles, and manage your organizational
          structure with full-width department and role cards.
        </p>
      </header>

      <section className="dept-role-section">
        <div className="section-header">
          <h2>📋 Departments & Roles</h2>
          <button
            className="btn btn-primary"
            onClick={() => openModal('addDepartment')}
          >
            ➕ Add New Department
          </button>
        </div>

        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-value">{stats.totalDepartments}</div>
            <div className="stat-label">Departments</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.totalRoles}</div>
            <div className="stat-label">Total Roles</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.avgRoles}</div>
            <div className="stat-label">Avg Roles/Dept</div>
          </div>
        </div>

        {departments.length === 0 ? (
          <div className="empty-state">
            <h3>No Departments Yet</h3>
            <p>Click “Add New Department” to create your first department.</p>
          </div>
        ) : (
          <div className="departments-container">
            {departments.map((dept) => (
              <div key={dept.id} className="department-item">
                <div className="department-header">
                  <div className="department-title">
                    🏢 {dept.name}
                    <span className="role-count">
                      {dept.roles.length} role
                      {dept.roles.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="department-actions">
                    <button
                      className="btn btn-success btn-small"
                      onClick={() =>
                        openModal('addRole', { deptId: dept.id })
                      }
                    >
                      ➕ Add Role
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() =>
                        openModal('editDepartment', {
                          id: dept.id,
                          name: dept.name,
                          description: dept.description,
                        })
                      }
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => deleteDepartment(dept.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                <div className="department-body">
                  <div className="department-description">
                    {dept.description || <em>No description provided</em>}
                  </div>
                  <div className="roles-section">
                    <div className="roles-header">
                      <div className="roles-title">
                        👥 Department Roles ({dept.roles.length})
                      </div>
                    </div>
                    <div className="roles-list">
                      {dept.roles.length === 0 ? (
                        <div className="no-roles">
                          No roles in this department yet.
                        </div>
                      ) : (
                        dept.roles.map((role, index) => (
                          <div key={role.id} className="role-item">
                            <div className="role-info">
                              <h4>
                                <span className="role-number">
                                  {index + 1}
                                </span>
                                <span className="role-title">{role.name}</span>
                              </h4>
                              <p>{role.description}</p>
                            </div>
                            <div className="role-actions">
                              <button
                                className="btn btn-secondary btn-xsmall"
                                onClick={() =>
                                  openModal('editRole', {
                                    id: role.id,
                                    deptId: dept.id,
                                    name: role.name,
                                    description: role.description,
                                  })
                                }
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className="btn btn-danger btn-xsmall"
                                onClick={() => deleteRole(dept.id, role.id)}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {activeModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {activeModal === 'addDepartment' && 'Add New Department'}
                {activeModal === 'editDepartment' && 'Edit Department'}
                {activeModal === 'addRole' && 'Add New Role'}
                {activeModal === 'editRole' && 'Edit Role'}
              </h3>
              <button className="close-modal" onClick={closeModal}>
                ×
              </button>
            </div>

            {(activeModal === 'addDepartment' ||
              activeModal === 'editDepartment') && (
              <form onSubmit={handleDepartmentSubmit}>
                <div className="form-group">
                  <label>Department Name *</label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="4"
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="button-group">
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {(activeModal === 'addRole' || activeModal === 'editRole') && (
              <form onSubmit={handleRoleSubmit}>
                <div className="form-group">
                  <label>Role Name *</label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role Description</label>
                  <textarea
                    rows="4"
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="button-group">
                  <button type="submit" className="btn btn-success">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
