"""Local test API: real export handlers/JWT, fictitious records, no live database."""
import json
from pathlib import Path
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'back-tcc-version-2/tests'))
from test_privacidade import Database, PrivacyTests
from auth import gerar_token
from flask import jsonify, request
from flask_cors import CORS
from werkzeug.serving import WSGIRequestHandler, make_server

PrivacyTests.setUpClass()
app = PrivacyTests.app
CORS(app, resources={r'/*': {'origins': '*'}})
state = {'requests': 0, 'delay': 0}


@app.get('/privacidade/atendimento')
def privacy_configuration():
    return jsonify(disponivel=False, responsavel=None, contato=None)


@app.get('/professores/alunos/<int:aluno_id>/solicitacoes-dados')
def privacy_tracking(aluno_id):
    return jsonify(solicitacoes=[], proximo_cursor=None)


@app.post('/__test/control')
def control():
    options = request.get_json() or {}
    if options.get('reset'):
        database = Database()
        database.tables['alunos'][0].update(nome='Aluno de Demonstração', ano_escolar='6º Ano',
            modo_aprendizagem='Nível 2 - Aprendiz Guiado', xp_total=100)
        database.tables['historico_desempenho'][0].update(concluido=True, tempo_segundos=10,
            modo_utilizado='Nível 2 - Aprendiz Guiado', data_hora='2026-11-06T16:00:00Z')
        PrivacyTests.module.supabase_admin = database
        state.update(requests=0, delay=0)
    if 'fail_table' in options:
        PrivacyTests.module.supabase_admin.fail_table = options['fail_table']
    if 'delay' in options:
        state['delay'] = min(float(options['delay']), 1)
    return jsonify(state)


@app.before_request
def test_request_tracking():
    if request.method == 'POST' and request.path.endswith('/relatorio-dados.pdf'):
        state['requests'] += 1
        time.sleep(state['delay'])


class QuietHandler(WSGIRequestHandler):
    def log_request(self, *args, **kwargs):
        pass


if __name__ == '__main__':
    server = make_server('127.0.0.1', 0, app, threaded=True, request_handler=QuietHandler)
    with app.app_context():
        tokens = {key: gerar_token({'id': identifier, 'nome': 'Teste'}, perfil=profile)
                  for key, identifier, profile in [('teacher', 5, 'professor'),
                      ('otherTeacher', 6, 'professor'), ('student', 17, 'aluno')]}
    print(json.dumps({'port': server.server_port, 'tokens': tokens}), flush=True)
    server.serve_forever()
