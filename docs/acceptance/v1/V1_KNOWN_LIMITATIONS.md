# Limitações conhecidas do candidato V1.0

## Limitações de produto

- Dashboard e Escritório de Agentes ainda dependem de `mock-api.ts` através do `api-client`.
- A tela de ideias não oferece criação real de pauta; as ações de pesquisa e priorização são toasts mockados.
- Pesquisa, roteiros e ativos têm leitura demonstrada, mas não têm criação/versionamento/importação comprovados pelo frontend nesta execução.
- O fluxo completo render → corte → qualidade → compliance → aprovação → publicação assistida não foi concluído com um registro novo.
- A qualidade da aceitação de V1 exige prova operacional pelo frontend; endpoints isolados, testes unitários e build verde não são suficientes.

## Limitações de evidência

- O servidor e o frontend foram executados localmente; não houve CI novo, publicação externa, upload ou deploy.
- Parte dos dados observados são seeds do ambiente de desenvolvimento. Eles servem para inspeção de leitura, não para provar mutações ponta a ponta.
- O browser exibiu aviso de hydration mismatch associado a `data-tsd-source`; não houve erro JavaScript ou falha de rede operacional atribuída a esse aviso, mas ele deve ser limpo antes do aceite final.
- Avisos do build Vite não bloquearam a compilação, porém devem ser revisados em uma rodada de hardening posterior.

## Segurança e escopo

- Nenhum `.env.local` foi editado. O arquivo existente fora do repositório efetivo permaneceu intocado.
- Nenhuma credencial foi exibida ou adicionada.
- Não foram criados migrations, provedores novos, integrações externas, releases ou tags.
- Não foi implementada uma API nova para dashboard/agentes: isso exigiria contrato e decisão de escopo próprios.

## Condição para reabrir o aceite

Reabrir somente após os bloqueios P0/P1 do [`V1_ACCEPTANCE_REPORT.md`](./V1_ACCEPTANCE_REPORT.md) serem fechados com evidência frontend persistida, testes de contrato e reexecução integral da matriz.
