# Copyright (c) 2026, rayan aouf and contributors
# For license information, please see license.txt

import frappe
from pos_ar.install import after_migrate


def execute():
	if frappe.flags.in_install:
		return
	after_migrate()
