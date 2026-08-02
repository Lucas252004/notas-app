import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Nota from './Nota'
import FormularioAuth from './FormularioAuth'
import FormularioNota from './FormularioNota'

describe('Nota', () => {
  const baseProps = {
    onEliminar: () => {},
    onAlternarCompletada: () => {},
    onAgregarSubtarea: () => {},
    onAlternarSubtarea: () => {},
    onEliminarSubtarea: () => {},
  }

  it('muestra el texto de la nota', () => {
    render(<Nota nota={{ id: 1, texto: 'Comprar pan', subtareas: [] }} {...baseProps} />)
    expect(screen.getByText('Comprar pan')).toBeInTheDocument()
  })

  it('llama a onEliminar al clickear el botón', () => {
    const onEliminar = vi.fn()
    render(
      <Nota nota={{ id: 1, texto: 'Comprar pan', subtareas: [] }} {...baseProps} onEliminar={onEliminar} />
    )
    fireEvent.click(screen.getByText('Eliminar'))
    expect(onEliminar).toHaveBeenCalledTimes(1)
  })

  it('muestra las subtareas y tacha la nota completada', () => {
    render(
      <Nota
        nota={{
          id: 1,
          texto: 'Proyecto',
          completada: true,
          subtareas: [{ id: 1, texto: 'Diseñar', completada: true }],
        }}
        {...baseProps}
      />
    )
    expect(screen.getByText('Proyecto')).toHaveClass('completada')
    expect(screen.getByText('Diseñar')).toHaveClass('completada')
  })
})

describe('FormularioAuth', () => {
  it('muestra error cuando el submit falla', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Credenciales inválidas'))
    render(<FormularioAuth titulo="Bienvenido de nuevo" onSubmit={onSubmit} alternativo={() => {}} />)

    fireEvent.change(screen.getByPlaceholderText('Tu email'), {
      target: { value: 'ana@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), {
      target: { value: 'clave123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Bienvenido de nuevo' }))

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
  })

  it('muestra texto para cambiar entre login y registro', () => {
    render(<FormularioAuth titulo="Bienvenido de nuevo" onSubmit={() => {}} alternativo={() => {}} />)
    expect(screen.getByText('¿No tenés cuenta? Creala')).toBeInTheDocument()
  })
})

describe('FormularioNota', () => {
  it('llama a onAgregar con el texto al hacer submit', () => {
    const onAgregar = vi.fn()
    render(<FormularioNota onAgregar={onAgregar} />)

    fireEvent.change(screen.getByPlaceholderText('Escribe una nota...'), {
      target: { value: 'Estudiar React' },
    })
    fireEvent.click(screen.getByText('Agregar'))

    expect(onAgregar).toHaveBeenCalledWith('Estudiar React')
  })
})
