import os
from flask import Flask, render_template, json
from flask import request
from collections import OrderedDict

import xlsxwriter

app = Flask(__name__)

filename = os.path.join(app.static_folder, 'data', 'hierarchical_gf_pump.json')
print(filename)

#running the app:
#python application.py (in the folder)

rel_keys = ['none', "=same", ">allocates", "<allocates", ">has_parent", "<has_parent", ">is_contained_by", "<is_contained_by"]

def export_to_excel(matrix):
    workbook = xlsxwriter.Workbook('arrays.xlsx')
    worksheet = workbook.add_worksheet()

    '''for index, row in enumerate(matrix['input_data']):
            print("printing row ", index)
            for cell in row:
                print("cell:",cell['x'],cell['y'], cell['z'] )'''
    #print("matrix:", matrix)
    filtered_nodelist = matrix['filtered_nodelist']
    full_nodelist = matrix['full_nodelist']
    #print(nodelist)
    for index, node in enumerate(filtered_nodelist):
        worksheet.write(index + 1, 0, node['name'])

    for index, node in enumerate(full_nodelist):
        worksheet.write(0, index + 1, node['name'])

    #https://www.geeksforgeeks.org/python-create-and-write-on-excel-file-using-xlsxwriter-module/
    for i, row in enumerate(matrix['input_data']):
        for j, cell in enumerate(row):
            #take cell.z, find a key number z in the array
            cell_str = rel_keys[int(cell['z'])]
            #print(cell['z'], cell_str, rel_keys)
            worksheet.write(i+1, j+1, cell_str)
    workbook.close()

@app.route('/') #we decorate the function with the URL
def test(): #define page
    with open(filename) as test_file:
        print('printing flask data')
        flask_data = json.load(test_file)
        print(flask_data)
        return render_template('test.html', data=flask_data) #return html, pass variable "data" with "flask_data" value

@app.route('/', methods=['POST'])
def get_data():
    if request.method == 'POST':
        matrix_data = request.json
        
        export_to_excel(matrix_data)
          
        return '', 200

@app.route('/<name>')
def user(name):
    return "Hello {}!".format(name)

if __name__ == '__main__':
    app.run(debug=True)
    
def export_to_excel(matrix):
    workbook = xlsxwriter.Workbook('arrays.xlsx')
    worksheet = workbook.add_worksheet()

    for index, row in enumerate(matrix['input_data']):
            print("printing row ", index)
            for cell in row:
                print("cell:",cell['x'],cell['y'], cell['z'] )
