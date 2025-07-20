'use client'

import { useState } from 'react'
import { Employee } from './types'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'

interface EmployeeSelectionDrawerProps {
  employees: Employee[]
  selectedMembers: Employee[]
  setSelectedMembers: (members: Employee[]) => void
}

export default function EmployeeSelectionDrawer({ employees, selectedMembers, setSelectedMembers }: EmployeeSelectionDrawerProps) {
  const [search, setSearch] = useState('')

  const handleSelect = (employee: Employee, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, employee])
    } else {
      setSelectedMembers(selectedMembers.filter(m => m.id !== employee.id))
    }
  }

  const filteredEmployees = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="mt-2 w-full border-neutral-700 hover:bg-neutral-800">
          Add Members
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-neutral-900 border-neutral-800 text-neutral-200 h-[80vh]">
        <div className="container mx-auto flex flex-col h-full">
            <DrawerHeader>
            <DrawerTitle>Add Members to Group</DrawerTitle>
            <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-4 bg-neutral-800 border-neutral-700"
            />
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-4">
            {filteredEmployees.map(employee => (
                <div key={employee.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-neutral-800">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={employee.profileImage} />
                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-semibold">{employee.name}</p>
                    <p className="text-sm text-neutral-400">{employee.designation}</p>
                </div>
                <Checkbox
                    checked={selectedMembers.some(m => m.id === employee.id)}
                    onCheckedChange={(checked) => handleSelect(employee, !!checked)}
                    className="border-neutral-600 data-[state=checked]:bg-green-500 data-[state=checked]:text-white"
                />
                </div>
            ))}
            </div>
            <DrawerFooter>
            <DrawerClose asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">Done ({selectedMembers.length})</Button>
            </DrawerClose>
            </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}