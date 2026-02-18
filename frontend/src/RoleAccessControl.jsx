import { useEffect, useMemo, useState } from 'react'
import { notifyPermissionsUpdated } from './roleAccess'
import SuccessPopup from './SuccessPopup'
import './RoleAccessControl.css'

const ROLE_STORAGE_KEY = 'department_roles'

const DEFAULT_ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Service Manager' },
  { value: 'technician', label: 'Service Technician' },
  { value: 'advisor', label: 'Service Advisor' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'viewer', label: 'View Only' },
]

const buildRoleOptions = (departments) => {
  if (!Array.isArray(departments)) {
    return DEFAULT_ROLE_OPTIONS
  }

  const options = departments.flatMap((dept) =>
    (dept.roles || []).map((role) => ({
      value: `role_${role.id}`,
      label: `${role.name} (${dept.name})`,
    }))
  )

  return options.length > 0 ? options : DEFAULT_ROLE_OPTIONS
}

const loadRoleOptions = () => {
  const stored = localStorage.getItem(ROLE_STORAGE_KEY)
  if (!stored) {
    return DEFAULT_ROLE_OPTIONS
  }

  try {
    return buildRoleOptions(JSON.parse(stored))
  } catch (error) {
    console.warn('Failed to parse stored roles:', error)
    return DEFAULT_ROLE_OPTIONS
  }
}

const MODULE_DEFINITIONS = [
  {
    id: 'overview',
    title: 'Overview Dashboard',
    icon: 'fas fa-tachometer-alt',
    category: 'core',
    options: [
      { id: 'overview_access', label: 'Overview Access', prefix: '-' },
    ],
  },
  {
    id: 'joborder',
    title: 'Job Order Management',
    icon: 'fas fa-clipboard-list',
    category: 'core',
    options: [
      {
        id: 'joborder_add',
        label: 'Add New Job Order Button',
        prefix: 'a.',
        children: [
          { id: 'joborder_add_viewprice', label: 'View Price', prefix: 'i.' },
          {
            id: 'joborder_add_discount',
            label: 'Discount',
            prefix: 'ii.',
            children: [
              {
                kind: 'percent',
                id: 'joborder_discount_percent',
                label: 'Maximum Discount Percentage',
                prefix: '-',
                defaultValue: 20,
              },
            ],
          },
        ],
      },
      {
        id: 'joborder_actions',
        label: 'Action Buttons',
        prefix: 'b.',
        children: [
          {
            id: 'joborder_viewdetails',
            label: 'View Details',
            prefix: 'i.',
            children: [
              { id: 'joborder_summary', label: 'Job Order Summary', prefix: '-' },
              { id: 'joborder_roadmap', label: 'Job Order Roadmap', prefix: '-' },
              { id: 'joborder_customer', label: 'Customer Information', prefix: '-' },
              { id: 'joborder_vehicle', label: 'Vehicle Information', prefix: '-' },
              {
                id: 'joborder_services',
                label: 'Services Summary',
                prefix: '-',
                children: [
                  {
                    id: 'joborder_addservice',
                    label: 'Add Service Button',
                    prefix: '-',
                    children: [
                      { id: 'joborder_serviceprice', label: 'View Price', prefix: '-' },
                      {
                        id: 'joborder_servicediscount',
                        label: 'Discount',
                        prefix: '-',
                        children: [
                          {
                            kind: 'percent',
                            id: 'joborder_servicediscount_percent',
                            label: 'Max Discount %',
                            prefix: '-',
                            defaultValue: 15,
                          },
                        ],
                      },
                      { id: 'joborder_pricesummary', label: 'Price Summary Card', prefix: '-' },
                    ],
                  },
                ],
              },
              { id: 'joborder_notes', label: 'Notes/Comments', prefix: '-' },
              { id: 'joborder_quality', label: 'Quality Check List', prefix: '-' },
              { id: 'joborder_billing', label: 'Billing & Invoices', prefix: '-' },
              { id: 'joborder_paymentlog', label: 'Payment Activity Log', prefix: '-' },
              { id: 'joborder_exitpermit', label: 'Exit Permit Details', prefix: '-' },
              {
                id: 'joborder_documents',
                label: 'Documents',
                prefix: '-',
                children: [
                  { id: 'joborder_download', label: 'Download Button', prefix: '-' },
                ],
              },
              { id: 'joborder_cancel', label: 'Cancel Order', prefix: '-' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'inspection',
    title: 'Inspection Management',
    icon: 'fas fa-search',
    category: 'core',
    options: [
      {
        id: 'inspection_actions',
        label: 'Action Buttons',
        prefix: 'a.',
        children: [
          {
            id: 'inspection_viewdetails',
            label: 'View Details',
            prefix: 'i.',
            children: [
              { id: 'inspection_summary', label: 'Job Order Summary', prefix: '-' },
              { id: 'inspection_roadmap', label: 'Job Order Roadmap', prefix: '-' },
              { id: 'inspection_customer', label: 'Customer Information', prefix: '-' },
              { id: 'inspection_vehicle', label: 'Vehicle Information', prefix: '-' },
              {
                id: 'inspection_services',
                label: 'Services Summary',
                prefix: '-',
                children: [
                  {
                    id: 'inspection_addservice',
                    label: 'Add Service Button',
                    prefix: '-',
                    children: [
                      { id: 'inspection_serviceprice', label: 'View Price', prefix: '-' },
                      {
                        id: 'inspection_servicediscount',
                        label: 'Discount',
                        prefix: '-',
                        children: [
                          {
                            kind: 'percent',
                            id: 'inspection_discount_percent',
                            label: 'Max Discount %',
                            prefix: '-',
                            defaultValue: 15,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'inspection_list',
        label: 'Inspection List',
        prefix: 'b.',
        children: [
          { id: 'inspection_finish', label: 'Finish Inspection Button', prefix: '-' },
          { id: 'inspection_start', label: 'Start Inspection Button', prefix: '-' },
          { id: 'inspection_resume', label: 'Resume Button', prefix: '-' },
          { id: 'inspection_notrequired', label: 'Not Required Button', prefix: '-' },
          { id: 'inspection_complete', label: 'Complete Inspection Button', prefix: '-' },
        ],
      },
      { id: 'inspection_notes', label: 'Notes/Comments', prefix: 'c.' },
      { id: 'inspection_quality', label: 'Quality Check List', prefix: 'd.' },
      { id: 'inspection_billing', label: 'Billing & Invoices', prefix: 'e.' },
      { id: 'inspection_paymentlog', label: 'Payment Activity Log', prefix: 'f.' },
      { id: 'inspection_exitpermit', label: 'Exit Permit Details', prefix: 'g.' },
      {
        id: 'inspection_documents',
        label: 'Documents',
        prefix: 'h.',
        children: [
          { id: 'inspection_download', label: 'Download Button', prefix: '-' },
        ],
      },
      { id: 'inspection_cancel', label: 'Cancel Order', prefix: 'i.' },
    ],
  },
  {
    id: 'serviceexec',
    title: 'Service Execution',
    icon: 'fas fa-tools',
    category: 'core',
    options: [
      {
        id: 'serviceexec_assigned',
        label: 'Assign to me tab',
        prefix: 'a.',
        children: [
          {
            id: 'serviceexec_assigned_actions',
            label: 'Action buttons',
            prefix: 'i.',
            children: [
              {
                id: 'serviceexec_assigned_viewdetails',
                label: 'View details',
                prefix: '-',
                children: [
                  { id: 'serviceexec_assigned_summary', label: 'Job order summary', prefix: '-' },
                  { id: 'serviceexec_assigned_roadmap', label: 'Job Order Roadmap', prefix: '-' },
                  { id: 'serviceexec_assigned_customer', label: 'Customer Information', prefix: '-' },
                  { id: 'serviceexec_assigned_vehicle', label: 'Vehicle Information', prefix: '-' },
                  {
                    id: 'serviceexec_assigned_services',
                    label: 'Services Summary',
                    prefix: '-',
                    children: [
                      {
                        id: 'serviceexec_assigned_addservice',
                        label: 'Add service button',
                        prefix: '-',
                        children: [
                          { id: 'serviceexec_assigned_serviceprice', label: 'View Price', prefix: '-' },
                          {
                            id: 'serviceexec_assigned_servicediscount',
                            label: 'Discount',
                            prefix: '-',
                            children: [
                              {
                                kind: 'percent',
                                id: 'serviceexec_assigned_discount_percent',
                                label: 'Set discount percentage',
                                prefix: '-',
                                defaultValue: 15,
                              },
                            ],
                          },
                          { id: 'serviceexec_assigned_pricesummary', label: 'Price Summary Card', prefix: '-' },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                id: 'serviceexec_assigned_edit',
                label: 'Edit button',
                prefix: '-',
                children: [
                  { id: 'serviceexec_assigned_assignedto', label: 'Assigned to', prefix: '-' },
                  { id: 'serviceexec_assigned_assigntech', label: 'Assign Technicians', prefix: '-' },
                  { id: 'serviceexec_assigned_workstatus', label: 'Service work status', prefix: '-' },
                  { id: 'serviceexec_assigned_dragdrop', label: 'Drag and drop', prefix: '-' },
                ],
              },
              { id: 'serviceexec_assigned_save', label: 'Save button', prefix: '-' },
              { id: 'serviceexec_assigned_finish', label: 'Finish work button', prefix: '-' },
            ],
          },
          { id: 'serviceexec_assigned_notes', label: 'Notes/Comments', prefix: 'ii.' },
          { id: 'serviceexec_assigned_quality', label: 'Quality Check List', prefix: 'iii.' },
          { id: 'serviceexec_assigned_billing', label: 'Billing & Invoices', prefix: 'iv.' },
          { id: 'serviceexec_assigned_paymentlog', label: 'Payment Activity Log', prefix: 'v.' },
          { id: 'serviceexec_assigned_exitpermit', label: 'Exit Permit Details', prefix: 'vi.' },
          {
            id: 'serviceexec_assigned_documents',
            label: 'Documents',
            prefix: 'vii.',
            children: [
              { id: 'serviceexec_assigned_download', label: 'Download button', prefix: '-' },
            ],
          },
          { id: 'serviceexec_assigned_cancelorder', label: 'Cancel order', prefix: 'viii.' },
        ],
      },
      {
        id: 'serviceexec_unassigned',
        label: 'Unassigned tab',
        prefix: 'b.',
        children: [
          {
            id: 'serviceexec_unassigned_actions',
            label: 'Action buttons',
            prefix: 'i.',
            children: [
              {
                id: 'serviceexec_unassigned_viewdetails',
                label: 'View details',
                prefix: '-',
                children: [
                  { id: 'serviceexec_unassigned_summary', label: 'Job order summary', prefix: '-' },
                  { id: 'serviceexec_unassigned_roadmap', label: 'Job Order Roadmap', prefix: '-' },
                  { id: 'serviceexec_unassigned_customer', label: 'Customer Information', prefix: '-' },
                  { id: 'serviceexec_unassigned_vehicle', label: 'Vehicle Information', prefix: '-' },
                  {
                    id: 'serviceexec_unassigned_services',
                    label: 'Services Summary',
                    prefix: '-',
                    children: [
                      {
                        id: 'serviceexec_unassigned_addservice',
                        label: 'Add service button',
                        prefix: '-',
                        children: [
                          { id: 'serviceexec_unassigned_serviceprice', label: 'View Price', prefix: '-' },
                          {
                            id: 'serviceexec_unassigned_servicediscount',
                            label: 'Discount',
                            prefix: '-',
                            children: [
                              {
                                kind: 'percent',
                                id: 'serviceexec_unassigned_discount_percent',
                                label: 'Set discount percentage',
                                prefix: '-',
                                defaultValue: 15,
                              },
                            ],
                          },
                          { id: 'serviceexec_unassigned_pricesummary', label: 'Price Summary Card', prefix: '-' },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                id: 'serviceexec_unassigned_edit',
                label: 'Edit button',
                prefix: '-',
                children: [
                  { id: 'serviceexec_unassigned_assignedto', label: 'Assigned to', prefix: '-' },
                  { id: 'serviceexec_unassigned_assigntech', label: 'Assign Technicians', prefix: '-' },
                  { id: 'serviceexec_unassigned_workstatus', label: 'Service work status', prefix: '-' },
                  { id: 'serviceexec_unassigned_dragdrop', label: 'Drag and drop', prefix: '-' },
                ],
              },
              { id: 'serviceexec_unassigned_save', label: 'Save button', prefix: '-' },
              { id: 'serviceexec_unassigned_finish', label: 'Finish work button', prefix: '-' },
            ],
          },
          { id: 'serviceexec_unassigned_notes', label: 'Notes/Comments', prefix: 'ii.' },
          { id: 'serviceexec_unassigned_quality', label: 'Quality Check List', prefix: 'iii.' },
          { id: 'serviceexec_unassigned_billing', label: 'Billing & Invoices', prefix: 'iv.' },
          { id: 'serviceexec_unassigned_paymentlog', label: 'Payment Activity Log', prefix: 'v.' },
          { id: 'serviceexec_unassigned_exitpermit', label: 'Exit Permit Details', prefix: 'vi.' },
          {
            id: 'serviceexec_unassigned_documents',
            label: 'Documents',
            prefix: 'vii.',
            children: [
              { id: 'serviceexec_unassigned_download', label: 'Download button', prefix: '-' },
            ],
          },
          { id: 'serviceexec_unassigned_cancelorder', label: 'Cancel order', prefix: 'viii.' },
        ],
      },
      {
        id: 'serviceexec_team',
        label: 'Team task tab',
        prefix: 'c.',
        children: [
          {
            id: 'serviceexec_team_actions',
            label: 'Action buttons',
            prefix: 'i.',
            children: [
              {
                id: 'serviceexec_team_viewdetails',
                label: 'View details',
                prefix: '-',
                children: [
                  { id: 'serviceexec_team_summary', label: 'Job order summary', prefix: '-' },
                  { id: 'serviceexec_team_roadmap', label: 'Job Order Roadmap', prefix: '-' },
                  { id: 'serviceexec_team_customer', label: 'Customer Information', prefix: '-' },
                  { id: 'serviceexec_team_vehicle', label: 'Vehicle Information', prefix: '-' },
                  {
                    id: 'serviceexec_team_services',
                    label: 'Services Summary',
                    prefix: '-',
                    children: [
                      {
                        id: 'serviceexec_team_addservice',
                        label: 'Add service button',
                        prefix: '-',
                        children: [
                          { id: 'serviceexec_team_serviceprice', label: 'View Price', prefix: '-' },
                          {
                            id: 'serviceexec_team_servicediscount',
                            label: 'Discount',
                            prefix: '-',
                            children: [
                              {
                                kind: 'percent',
                                id: 'serviceexec_team_discount_percent',
                                label: 'Set discount percentage',
                                prefix: '-',
                                defaultValue: 15,
                              },
                            ],
                          },
                          { id: 'serviceexec_team_pricesummary', label: 'Price Summary Card', prefix: '-' },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                id: 'serviceexec_team_edit',
                label: 'Edit button',
                prefix: '-',
                children: [
                  { id: 'serviceexec_team_assignedto', label: 'Assigned to', prefix: '-' },
                  { id: 'serviceexec_team_assigntech', label: 'Assign Technicians', prefix: '-' },
                  { id: 'serviceexec_team_workstatus', label: 'Service work status', prefix: '-' },
                  { id: 'serviceexec_team_dragdrop', label: 'Drag and drop', prefix: '-' },
                ],
              },
              { id: 'serviceexec_team_save', label: 'Save button', prefix: '-' },
              { id: 'serviceexec_team_finish', label: 'Finish work button', prefix: '-' },
            ],
          },
          { id: 'serviceexec_team_notes', label: 'Notes/Comments', prefix: 'ii.' },
          { id: 'serviceexec_team_quality', label: 'Quality Check List', prefix: 'iii.' },
          { id: 'serviceexec_team_billing', label: 'Billing & Invoices', prefix: 'iv.' },
          { id: 'serviceexec_team_paymentlog', label: 'Payment Activity Log', prefix: 'v.' },
          { id: 'serviceexec_team_exitpermit', label: 'Exit Permit Details', prefix: 'vi.' },
          {
            id: 'serviceexec_team_documents',
            label: 'Documents',
            prefix: 'vii.',
            children: [
              { id: 'serviceexec_team_download', label: 'Download button', prefix: '-' },
            ],
          },
          { id: 'serviceexec_team_cancelorder', label: 'Cancel order', prefix: 'viii.' },
        ],
      },
    ],
  },
  {
    id: 'deliveryqc',
    title: 'Delivery Quality Check',
    icon: 'fas fa-clipboard-check',
    category: 'core',
    options: [
      {
        id: 'deliveryqc_actions',
        label: 'Action buttons',
        prefix: 'a.',
        children: [
          {
            id: 'deliveryqc_viewdetails',
            label: 'View details',
            prefix: '-',
            children: [
              { id: 'deliveryqc_summary', label: 'Job order summary', prefix: '-' },
              { id: 'deliveryqc_roadmap', label: 'Job Order Roadmap', prefix: '-' },
              { id: 'deliveryqc_customer', label: 'Customer Information', prefix: '-' },
              { id: 'deliveryqc_vehicle', label: 'Vehicle Information', prefix: '-' },
              { id: 'deliveryqc_services', label: 'Services Summary', prefix: '-' },
              { id: 'deliveryqc_notes', label: 'Notes/Comments', prefix: '-' },
              {
                id: 'deliveryqc_quality',
                label: 'Quality Check List',
                prefix: '-',
                children: [
                  { id: 'deliveryqc_finish', label: 'Finish Button', prefix: '-' },
                  { id: 'deliveryqc_update', label: 'Update result dropdown list', prefix: '-' },
                ],
              },
              { id: 'deliveryqc_billing', label: 'Billing & Invoices', prefix: '-' },
              { id: 'deliveryqc_paymentlog', label: 'Payment Activity Log', prefix: '-' },
              { id: 'deliveryqc_exitpermit', label: 'Exit Permit Details', prefix: '-' },
              {
                id: 'deliveryqc_documents',
                label: 'Documents',
                prefix: '-',
                children: [
                  { id: 'deliveryqc_download', label: 'Download button', prefix: '-' },
                ],
              },
              { id: 'deliveryqc_cancel', label: 'Cancel order', prefix: '-' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'payment',
    title: 'Payment & Invoice',
    icon: 'fas fa-file-invoice-dollar',
    category: 'financial',
    options: [
      {
        id: 'payment_actions',
        label: 'Action buttons',
        prefix: 'a.',
        children: [
          {
            id: 'payment_viewdetails',
            label: 'View details',
            prefix: '-',
            children: [
              { id: 'payment_summary', label: 'Job order summary', prefix: '-' },
              { id: 'payment_roadmap', label: 'Job Order Roadmap', prefix: '-' },
              { id: 'payment_customer', label: 'Customer Information', prefix: '-' },
              { id: 'payment_vehicle', label: 'Vehicle Information', prefix: '-' },
              { id: 'payment_services', label: 'Services Summary', prefix: '-' },
              { id: 'payment_notes', label: 'Notes/Comments', prefix: '-' },
              { id: 'payment_quality', label: 'Quality Check List', prefix: '-' },
              {
                id: 'payment_billing',
                label: 'Billing & Invoices',
                prefix: '-',
                children: [
                  {
                    id: 'payment_pay',
                    label: 'Payment button',
                    prefix: '-',
                    children: [
                      { id: 'payment_discountfield', label: 'Discount field', prefix: '-' },
                      {
                        kind: 'percent',
                        id: 'payment_discount_percent',
                        label: 'Set discount percentage',
                        prefix: '-',
                        defaultValue: 10,
                      },
                    ],
                  },
                  { id: 'payment_refund', label: 'Refund button', prefix: '-' },
                  { id: 'payment_generatebill', label: 'Generate bill button', prefix: '-' },
                ],
              },
              { id: 'payment_paymentlog', label: 'Payment Activity Log', prefix: '-' },
              { id: 'payment_exitpermit', label: 'Exit Permit Details', prefix: '-' },
              {
                id: 'payment_documents',
                label: 'Documents',
                prefix: '-',
                children: [
                  { id: 'payment_download', label: 'Download button', prefix: '-' },
                ],
              },
              { id: 'payment_cancel', label: 'Cancel order', prefix: '-' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'exitpermit',
    title: 'Exit Permit',
    icon: 'fas fa-door-open',
    category: 'core',
    options: [
      {
        id: 'exitpermit_actions',
        label: 'Action buttons',
        prefix: 'a.',
        children: [
          {
            id: 'exitpermit_viewdetails',
            label: 'View details button',
            prefix: '-',
            children: [
              { id: 'exitpermit_summary', label: 'Job order summary', prefix: '-' },
              { id: 'exitpermit_roadmap', label: 'Job Order Roadmap', prefix: '-' },
              { id: 'exitpermit_customer', label: 'Customer Information', prefix: '-' },
              { id: 'exitpermit_vehicle', label: 'Vehicle Information', prefix: '-' },
              { id: 'exitpermit_services', label: 'Services Summary', prefix: '-' },
              { id: 'exitpermit_notes', label: 'Notes/Comments', prefix: '-' },
              { id: 'exitpermit_quality', label: 'Quality Check List', prefix: '-' },
              { id: 'exitpermit_billing', label: 'Billing & Invoices', prefix: '-' },
              { id: 'exitpermit_paymentlog', label: 'Payment Activity Log', prefix: '-' },
              { id: 'exitpermit_exitpermit', label: 'Exit Permit Details', prefix: '-' },
              {
                id: 'exitpermit_documents',
                label: 'Documents',
                prefix: '-',
                children: [
                  { id: 'exitpermit_download', label: 'Download button', prefix: '-' },
                ],
              },
            ],
          },
        ],
      },
      { id: 'exitpermit_create', label: 'Create Exit permit button', prefix: 'b.' },
      { id: 'exitpermit_cancelorder', label: 'Cancel order button', prefix: 'c.' },
    ],
  },
  {
    id: 'joborderhistory',
    title: 'Job Order History',
    icon: 'fas fa-history',
    category: 'core',
    options: [
      { id: 'joborderhistory_export', label: 'Export button', prefix: 'a.' },
      {
        id: 'joborderhistory_viewdetails',
        label: 'View details button',
        prefix: 'b.',
        children: [
          { id: 'joborderhistory_summary', label: 'Job order summary', prefix: '-' },
          { id: 'joborderhistory_roadmap', label: 'Job Order Roadmap', prefix: '-' },
          { id: 'joborderhistory_customer', label: 'Customer Information', prefix: '-' },
          { id: 'joborderhistory_vehicle', label: 'Vehicle Information', prefix: '-' },
          { id: 'joborderhistory_services', label: 'Services Summary', prefix: '-' },
          { id: 'joborderhistory_notes', label: 'Notes/Comments', prefix: '-' },
          { id: 'joborderhistory_quality', label: 'Quality Check List', prefix: '-' },
          { id: 'joborderhistory_billing', label: 'Billing & Invoices', prefix: '-' },
          { id: 'joborderhistory_paymentlog', label: 'Payment Activity Log', prefix: '-' },
          { id: 'joborderhistory_exitpermit', label: 'Exit Permit Details', prefix: '-' },
          {
            id: 'joborderhistory_documents',
            label: 'Documents',
            prefix: '-',
            children: [
              { id: 'joborderhistory_download', label: 'Download button', prefix: '-' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'customer',
    title: 'Customer Management',
    icon: 'fas fa-users',
    category: 'management',
    options: [
      { id: 'customer_add', label: 'Add new customer button', prefix: 'a.' },
      {
        id: 'customer_actions',
        label: 'Action buttons',
        prefix: 'b.',
        children: [
          {
            id: 'customer_viewdetails',
            label: 'View details',
            prefix: 'i.',
            children: [
              {
                id: 'customer_info',
                label: 'Customer Information',
                prefix: '-',
                children: [
                  { id: 'customer_edit', label: 'Edit customer', prefix: '-' },
                ],
              },
              {
                id: 'customer_vehicles',
                label: 'Registered Vehicles',
                prefix: '-',
                children: [
                  { id: 'customer_addvehicle', label: 'Add new vehicle button', prefix: '-' },
                  {
                    id: 'customer_vehicleactions',
                    label: 'Action buttons',
                    prefix: '-',
                    children: [
                      { id: 'customer_viewvehicle', label: 'View details button', prefix: '-' },
                      { id: 'customer_deletevehicle', label: 'Delete vehicle button', prefix: '-' },
                      { id: 'customer_editcustomer', label: 'Edit customer', prefix: '-' },
                      { id: 'customer_delete', label: 'Delete', prefix: '-' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'vehicle',
    title: 'Vehicle Management',
    icon: 'fas fa-car',
    category: 'management',
    options: [
      { id: 'vehicle_add', label: 'Add new vehicle button', prefix: 'a.' },
      {
        id: 'vehicle_actions',
        label: 'Action buttons',
        prefix: 'b.',
        children: [
          {
            id: 'vehicle_viewdetails',
            label: 'View details button',
            prefix: 'i.',
            children: [
              { id: 'vehicle_customer', label: 'Customer Information', prefix: '-' },
              { id: 'vehicle_info', label: 'Vehicle Information', prefix: '-' },
              {
                id: 'vehicle_completed',
                label: 'Completed Services',
                prefix: '-',
                children: [
                  { id: 'vehicle_addorder', label: 'Add new order button', prefix: '-' },
                  { id: 'vehicle_vieworder', label: 'View details button', prefix: '-' },
                ],
              },
            ],
          },
          { id: 'vehicle_edit', label: 'Edit vehicle', prefix: 'ii.' },
          { id: 'vehicle_delete', label: 'Delete vehicle', prefix: 'iii.' },
        ],
      },
    ],
  },
  {
    id: 'system',
    title: 'System Modules',
    icon: 'fas fa-cogs',
    category: 'management',
    options: [
      { id: 'system_serviceapproval', label: 'Service approval', prefix: '-' },
      { id: 'system_saleslead', label: 'Sales lead management', prefix: '-' },
      { id: 'system_salesleadhistory', label: 'Sales lead history', prefix: '-' },
      { id: 'system_purchases', label: 'Purchases', prefix: '-' },
      { id: 'system_inventory', label: 'Inventory', prefix: '-' },
      { id: 'system_reports', label: 'Reports', prefix: '-' },
      { id: 'system_hr', label: 'Human resources', prefix: '-' },
      { id: 'system_myrequest', label: 'My request', prefix: '-' },
      { id: 'system_accountant', label: 'Accountant', prefix: '-' },
      { id: 'system_servicecreation', label: 'Service creation', prefix: '-' },
      { id: 'system_userrole', label: 'User role access', prefix: '-' },
      { id: 'system_dashboarduser', label: 'Dashboard user management', prefix: '-' },
      { id: 'system_departmentrole', label: 'Department and role management', prefix: '-' },
      { id: 'system_systemuser', label: 'System user management', prefix: '-' },
      { id: 'system_userprofile', label: 'User profile', prefix: '-' },
      { id: 'system_inspectionlist', label: 'Inspection list', prefix: '-' },
      { id: 'system_serviceapprovalhistory', label: 'Service approval history', prefix: '-' },
    ],
  },
]

const buildPercentDefaults = () => {
  const defaults = {}
  const walk = (options) => {
    options.forEach((option) => {
      if (option.kind === 'percent') {
        defaults[option.id] = option.defaultValue
      }
      if (option.children) {
        walk(option.children)
      }
    })
  }

  MODULE_DEFINITIONS.forEach((module) => {
    walk(module.options)
  })

  return defaults
}

const collectToggleOptionIds = (options) => {
  let ids = []
  options.forEach((option) => {
    if (option.kind !== 'percent' && option.id) {
      ids.push(option.id)
    }
    if (option.children) {
      ids = ids.concat(collectToggleOptionIds(option.children))
    }
  })
  return ids
}

const applyRoleDefaults = (permissions, role) => {
  if (role === 'technician') {
    permissions.joborder.options.joborder_add = false
    permissions.payment.enabled = false
    permissions.customer.enabled = false
    permissions.vehicle.enabled = false
    permissions.system.enabled = false
  } else if (role === 'advisor') {
    permissions.payment.enabled = false
    permissions.payment.options.payment_pay = false
  } else if (role === 'cashier') {
    permissions.joborder.enabled = false
    permissions.inspection.enabled = false
    permissions.serviceexec.enabled = false
    permissions.deliveryqc.enabled = false
    permissions.customer.enabled = false
    permissions.vehicle.enabled = false
    permissions.system.enabled = false
  }
}

const buildDefaultPermissions = (role) => {
  const base = {}

  MODULE_DEFINITIONS.forEach((module) => {
    base[module.id] = { enabled: true, options: {} }
    collectToggleOptionIds(module.options).forEach((optionId) => {
      base[module.id].options[optionId] = true
    })
  })

  applyRoleDefaults(base, role)
  return base
}

const buildSearchIndex = (options) => {
  let labels = []
  options.forEach((option) => {
    labels.push(option.label.toLowerCase())
    if (option.children) {
      labels = labels.concat(buildSearchIndex(option.children))
    }
  })
  return labels
}

const OptionNode = ({
  moduleId,
  option,
  level,
  moduleEnabled,
  permissions,
  onToggleOption,
  percentValues,
  onPercentChange,
  parentEnabled,
}) => {
  const isPercent = option.kind === 'percent'
  const optionEnabled = isPercent
    ? parentEnabled
    : moduleEnabled && permissions[moduleId]?.options?.[option.id]
  const disabled = isPercent ? !moduleEnabled || !parentEnabled : !moduleEnabled

  return (
    <div className={`rac-option rac-level-${level} ${optionEnabled ? '' : 'rac-disabled'}`}>
      <div className="rac-option-row">
        <div className="rac-option-label">
          {option.prefix && <span className="rac-option-prefix">{option.prefix}</span>}
          <span>{option.label}</span>
        </div>
        {!isPercent && (
          <label className="rac-toggle">
            <input
              type="checkbox"
              checked={!!optionEnabled}
              disabled={!moduleEnabled}
              onChange={(event) => onToggleOption(moduleId, option.id, event.target.checked)}
            />
            <span className="rac-slider" />
          </label>
        )}
        {isPercent && (
          <div className="rac-percent-field">
            <input
              type="number"
              min="0"
              max="100"
              value={percentValues[option.id] ?? option.defaultValue}
              disabled={disabled}
              onChange={(event) => onPercentChange(option.id, event.target.value)}
            />
            <span>%</span>
          </div>
        )}
      </div>
      {option.children && (
        <div className="rac-children">
          {option.children.map((child) => (
            <OptionNode
              key={child.id}
              moduleId={moduleId}
              option={child}
              level={level + 1}
              moduleEnabled={moduleEnabled}
              permissions={permissions}
              onToggleOption={onToggleOption}
              percentValues={percentValues}
              onPercentChange={onPercentChange}
              parentEnabled={optionEnabled}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const RoleAccessControl = () => {
  const [roleOptions, setRoleOptions] = useState(() => loadRoleOptions())
  const [currentRole, setCurrentRole] = useState(() => roleOptions[0]?.value || 'admin')
  const [permissions, setPermissions] = useState(() =>
    buildDefaultPermissions(roleOptions[0]?.value || 'admin')
  )
  const [expandedModules, setExpandedModules] = useState({ overview: true })
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [percentValues, setPercentValues] = useState(() => buildPercentDefaults())
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!currentRole) {
      return
    }

    const stored = localStorage.getItem(`permissions_${currentRole}`)
    if (stored) {
      setPermissions(JSON.parse(stored))
    } else {
      setPermissions(buildDefaultPermissions(currentRole))
    }
    setExpandedModules({})
    setPercentValues(buildPercentDefaults())
  }, [currentRole])

  useEffect(() => {
    const nextOptions = loadRoleOptions()
    setRoleOptions(nextOptions)
    if (!nextOptions.find((role) => role.value === currentRole)) {
      setCurrentRole(nextOptions[0]?.value || '')
    }
  }, [])

  useEffect(() => {
    if (roleOptions.length === 0) {
      return
    }

    if (!roleOptions.find((role) => role.value === currentRole)) {
      setCurrentRole(roleOptions[0].value)
    }
  }, [roleOptions, currentRole])

  const modulesWithSearchIndex = useMemo(() => {
    return MODULE_DEFINITIONS.map((module) => ({
      ...module,
      searchIndex: [module.title.toLowerCase(), ...buildSearchIndex(module.options)],
    }))
  }, [])

  const visibleModules = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return modulesWithSearchIndex.filter((module) => {
      const matchesCategory = activeCategory === 'all' || module.category === activeCategory
      const matchesSearch = term.length === 0 || module.searchIndex.some((label) => label.includes(term))
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchTerm, modulesWithSearchIndex])

  const handleToggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }))
  }

  const handleToggleModuleEnabled = (moduleId, enabled) => {
    setPermissions((prev) => {
      const next = {
        ...prev,
        [moduleId]: {
          ...prev[moduleId],
          enabled,
          options: { ...prev[moduleId].options },
        },
      }

      if (!enabled) {
        Object.keys(next[moduleId].options).forEach((optionId) => {
          next[moduleId].options[optionId] = false
        })
      }

      return next
    })
  }

  const handleToggleOption = (moduleId, optionId, enabled) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        options: {
          ...prev[moduleId].options,
          [optionId]: enabled,
        },
      },
    }))
  }

  const handlePercentChange = (id, value) => {
    setPercentValues((prev) => ({
      ...prev,
      [id]: value === '' ? '' : Number(value),
    }))
  }

  const showSuccessMessage = (message) => {
    setSuccessMessage(message)
    setShowSuccessPopup(true)
  }

  const handleReset = () => {
    if (!window.confirm('Are you sure you want to reset all changes for this role?')) {
      return
    }
    localStorage.removeItem(`permissions_${currentRole}`)
    setPermissions(buildDefaultPermissions(currentRole))
    setPercentValues(buildPercentDefaults())
    notifyPermissionsUpdated()
    showSuccessMessage('Permissions reset to defaults!')
  }

  const handleSave = () => {
    localStorage.setItem(`permissions_${currentRole}`, JSON.stringify(permissions))
    const roleLabel = roleOptions.find((role) => role.value === currentRole)?.label || currentRole
    notifyPermissionsUpdated()
    showSuccessMessage(`Permissions for ${roleLabel} have been saved successfully!`)
  }

  return (
    <div className="rac-page">
      <div className="rac-container">
        <header className="rac-header">
          <div>
            <h1>Role Access Control</h1>
            <p>Manage permissions for different user roles in the system</p>
          </div>
        </header>

        <section className="rac-role-section">
          <div className="rac-role-selector">
            <label htmlFor="rac-role-select">Select Role to Modify:</label>
            <select
              id="rac-role-select"
              value={currentRole}
              onChange={(event) => setCurrentRole(event.target.value)}
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <div className="rac-current-role">
              <i className="fas fa-user-shield" />
              Currently editing: <span>{roleOptions.find((role) => role.value === currentRole)?.label}</span>
            </div>
          </div>
        </section>

        <div className="rac-search-box">
          <i className="fas fa-search" />
          <input
            type="text"
            placeholder="Search permissions... (e.g., discount, view details, job order)"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="rac-tabs">
          {[
            { id: 'all', label: 'All Modules' },
            { id: 'core', label: 'Core Operations' },
            { id: 'financial', label: 'Financial' },
            { id: 'management', label: 'Management' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`rac-tab ${activeCategory === tab.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section className="rac-modules">
          {visibleModules.map((module, index) => {
            const moduleState = permissions[module.id] || { enabled: false, options: {} }
            const isExpanded = !!expandedModules[module.id]

            return (
              <div
                key={module.id}
                className={`rac-module-card ${moduleState.enabled ? '' : 'rac-module-disabled'}`}
                style={{ animationDelay: `${index * 0.04}s` }}
              >
                <div
                  className={`rac-module-header ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => handleToggleModule(module.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      handleToggleModule(module.id)
                    }
                  }}
                >
                  <div className="rac-module-title">
                    <i className={module.icon} />
                    <span>{module.title}</span>
                    <span
                      className={`rac-status-indicator ${moduleState.enabled ? 'enabled' : 'disabled'}`}
                    />
                  </div>
                  <div className="rac-module-toggle" onClick={(event) => event.stopPropagation()}>
                    <span className="rac-toggle-label">Enable/Disable</span>
                    <label className="rac-toggle">
                      <input
                        type="checkbox"
                        checked={moduleState.enabled}
                        onChange={(event) => handleToggleModuleEnabled(module.id, event.target.checked)}
                      />
                      <span className="rac-slider" />
                    </label>
                    <i className="fas fa-chevron-down rac-expand-icon" />
                  </div>
                </div>
                <div className={`rac-module-content ${isExpanded ? 'expanded' : ''}`}>
                  {module.options.map((option) => (
                    <OptionNode
                      key={option.id}
                      moduleId={module.id}
                      option={option}
                      level={1}
                      moduleEnabled={moduleState.enabled}
                      permissions={permissions}
                      onToggleOption={handleToggleOption}
                      percentValues={percentValues}
                      onPercentChange={handlePercentChange}
                      parentEnabled={moduleState.enabled}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </section>

        <section className="rac-actions">
          <button type="button" className="rac-btn rac-btn-ghost" onClick={handleReset}>
            <i className="fas fa-undo" />
            Reset Changes
          </button>
          <button type="button" className="rac-btn rac-btn-primary" onClick={handleSave}>
            <i className="fas fa-save" />
            Save Permissions
          </button>
        </section>
      </div>

      <SuccessPopup 
        isVisible={showSuccessPopup} 
        onClose={() => setShowSuccessPopup(false)} 
        message={successMessage}
      />
    </div>
  )
}

export default RoleAccessControl
